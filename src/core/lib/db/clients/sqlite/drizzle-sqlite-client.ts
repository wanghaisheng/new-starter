import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { drizzleSchema } from '@/core/lib/db/schema/drizzle-schema';
import { migrationSQL } from '@/core/lib/db/schema/drizzle-schema';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { ColumnType } from '@/core/lib/db/schema/types';
import { TableSchema } from '@/core/lib/db/schema/types';
import { ClientRegistry } from '@/core/services/data/adapters/client-registry';

/**
 * DrizzleSQLiteClient: 基于 drizzle-orm 的 SQLite Client
 * 用于自动建表、基础 CRUD，兼容 TableSchema
 */
export class DrizzleSQLiteClient<T extends BaseEntity> extends BaseClient<T> {
  private db: any;
  private drizzleDb: ReturnType<typeof drizzle>;
  private tables: Record<string, any>;
  private schemasByName: Record<string, TableSchema> = {};
  private schemas: TableSchema[];

  constructor(dbFile: string, tables: Record<string, any>, schemas: TableSchema[]) {
    super();
    this.db = new Database(dbFile);
    this.drizzleDb = drizzle(this.db);
    this.tables = tables;
    this.schemas = schemas;
    for (const schema of schemas) {
      this.schemasByName[schema.name] = schema;
    }
  }

  async initialize(): Promise<void> {
    // 自动建表，执行所有 migrationSQL
    if (migrationSQL && Array.isArray(migrationSQL)) {
      for (const sql of migrationSQL) {
        this.db.prepare(sql).run();
      }
    }
    this.initialized = true;
  }

  async close(): Promise<void> {
    this.db.close();
    this.initialized = false;
  }

  async clear(): Promise<void> {
    // 清空所有表（仅开发测试用）
    for (const tableName of Object.keys(this.tables)) {
      await this.executeRawQuery(`DELETE FROM ${tableName}`);
    }
  }

  async connect(): Promise<void> {
    // SQLite 无需显式 connect
    this.initialized = true;
  }

  async disconnect(): Promise<void> {
    this.db.close();
    this.initialized = false;
  }

  // 类型兜底转换，参考 kysely-sqlite-client，实现 boolean/date/json 等字段的自动转换
  private prepareRow(tableName: string, data: Partial<T>): Partial<T> {
    const schema = this.schemasByName[tableName];
    if (!schema) {
      console.error('[DrizzleSQLiteClient.prepareRow] Schema not found for tableName:', tableName, '| schemasByName keys:', Object.keys(this.schemasByName));
      throw new Error(`[DrizzleSQLiteClient.prepareRow] Schema not found for tableName: ${tableName}`);
    }
    const row: Record<string, any> = { ...data };
    const invalidFields: { name: string; value: any; type: string }[] = [];
    for (const col of schema.columns) {
      // 只要 mock 里有该字段（即使为 undefined/null/空数组），都要处理
      if (!(col.name in row)) continue;
      let value = row[col.name];
      if (value === undefined) { row[col.name] = null; continue; }
      // 兼容 ColumnType 枚举和字符串
      let typeStr = '';
      if (typeof col.type === 'string') {
        typeStr = col.type.toLowerCase();
      } else if (typeof col.type === 'number') {
        switch (col.type) {
          case ColumnType.BOOLEAN: typeStr = 'boolean'; break;
          case ColumnType.DATETIME: typeStr = 'datetime'; break;
          case ColumnType.DATE: typeStr = 'date'; break;
          case ColumnType.JSON: typeStr = 'json'; break;
          default: typeStr = '';
        }
      }
      if (typeStr === 'boolean') {
        const val = row[col.name];
        row[col.name] = val === true || val === 1 || val === '1' || val === 'true' || val === 'TRUE' ? 1 : 0;
      } else if (typeStr === 'datetime' || typeStr === 'date') {
        row[col.name] = value instanceof Date ? value.toISOString() : value;
      } else if (typeStr === 'json') {
        row[col.name] = JSON.stringify(value || {});
      }
      // 检查 SQLite 支持的类型
      const finalVal = row[col.name];
      if (
        finalVal !== null &&
        typeof finalVal !== 'number' &&
        typeof finalVal !== 'string' &&
        typeof finalVal !== 'bigint' &&
        !Buffer.isBuffer(finalVal)
      ) {
        invalidFields.push({ name: col.name, value: finalVal, type: typeof finalVal });
      }
    }
    if (invalidFields.length > 0) {
      // eslint-disable-next-line no-console
      console.error('[DrizzleSQLiteClient.prepareRow] Invalid SQLite field types:', invalidFields);
    }
    return row as Partial<T>;
  }

  // 新增：查询后类型自动转换
  private parseRow(tableName: string, row: any): T {
    const schema = this.schemasByName[tableName];
    if (!schema) return row;
    const parsed: Record<string, any> = { ...row };
    for (const col of schema.columns) {
      let typeStr = typeof col.type === 'string' ? col.type :
        (typeof col.type === 'number' ?
          (col.type === ColumnType.BOOLEAN ? 'boolean' :
           col.type === ColumnType.DATETIME ? 'datetime' :
           col.type === ColumnType.DATE ? 'date' :
           col.type === ColumnType.JSON ? 'json' : '')
          : '');
      if (typeStr === 'boolean') {
        const val = row[col.name];
        parsed[col.name] = val === 1 || val === '1' || val === true || val === 'true' || val === 'TRUE';
      } else if (typeStr === 'datetime' || typeStr === 'date') {
        if (row[col.name]) parsed[col.name] = new Date(row[col.name]).toISOString();
      } else if (typeStr === 'json') {
        try {
          parsed[col.name] = JSON.parse(row[col.name] || '{}');
        } catch (e) {
          parsed[col.name] = {};
        }
      }
    }
    return parsed as T;
  }

  /**
   * 通用查询，支持 =、in、like、gt、lt 等操作符，自动类型转换，支持分页排序
   * 示例：
   *   await client.query(table, { where: { email: { eq: 'a@test.com' }, age: { gt: 18 }, tags: { in: ['vip', 'svip'] }, name: { like: '%张%' } }, _limit: 10, _offset: 0, _orderBy: 'id DESC' })
   */
  async query(tableName: string, options: any): Promise<{ items: T[]; data?: T[] }> {
    this.checkInitialized();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);
    let query: any = this.drizzleDb.select().from(table);
    if (options?.where) {
      const schema = this.schemasByName[tableName];
      for (const key in options.where) {
        const cond = options.where[key];
        const colSchema = schema?.columns.find(col => col.name === key);
        if (colSchema?.type === ColumnType.JSON && Array.isArray(cond)) {
          const conditions = cond.map(tag => 
            sql`json_array_length(json_extract(${sql.identifier(key)}, '$')) > 0 AND json_extract(${sql.identifier(key)}, '$') LIKE ${'%"' + tag + '"%'}`
          );
          query = query.where(sql`(${sql.join(conditions, sql` AND `)})`);
          continue;
        }
        if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
          // 支持 in、like、gt、lt、eq
          if (cond.in) {
            query = query.where(sql`${sql.raw('"' + key + '"')} in ${cond.in}`);
          } else if (cond.like) {
            query = query.where(sql`${sql.raw('"' + key + '"')} like ${cond.like} COLLATE NOCASE`);
          } else if (cond.gt !== undefined) {
            query = query.where(sql`${sql.raw('"' + key + '"')} > ${cond.gt}`);
          } else if (cond.gte !== undefined) {
            query = query.where(sql`${sql.raw('"' + key + '"')} >= ${cond.gte}`);
          } else if (cond.lt !== undefined) {
            query = query.where(sql`${sql.raw('"' + key + '"')} < ${cond.lt}`);
          } else if (cond.lte !== undefined) {
            query = query.where(sql`${sql.raw('"' + key + '"')} <= ${cond.lte}`);
          } else if (cond.eq !== undefined) {
            query = query.where(sql`${sql.raw('"' + key + '"')} = ${cond.eq}`);
          }
        } else {
          query = query.where(sql`${sql.raw('"' + key + '"')} = ${cond}`);
        }
      }
    }
    if (options?._limit) query = query.limit(options._limit);
    if (options?._offset) query = query.offset(options._offset);
    if (options?._orderBy) {
      const [column, direction] = options._orderBy.split(' ');
      const schema = this.schemas.find(s => s.name === tableName);
      if (!schema?.columns.find(c => c.name === column)) {
        throw new Error(`Invalid column name: ${column}`);
      }
      query = query.orderBy(sql`${sql.identifier(column)} ${direction === 'DESC' ? sql`DESC` : sql`ASC`}`);
    }
    const result = await query.all();
    const parsed = Array.isArray(result) ? result.map(row => this.parseRow(tableName, row)) : [];
    return { items: parsed };
  }

  /**
   * 通用 findAll，支持复杂条件
   */
  async findAll(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    return (await this.query(tableName, { where: filter })).items;
  }

  async findById(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);
    const result = await this.drizzleDb.select().from(table).where(sql`id = ${id}`).all();
    return Array.isArray(result) && result.length > 0 ? (result[0] as T) : null;
  }

  async create(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);
    const row = this.prepareRow(tableName, data as any);
    await this.drizzleDb.insert(table).values(row).run();
    return row as T;
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);
    const row = this.prepareRow(tableName, data as any);
    const result = await this.drizzleDb.update(table).set(row).where(sql`id = ${id}`).run();
    if (!result || result.changes === 0) {
      throw new Error(`Update failed: ${tableName} id=${id} not found`);
    }
  }

  /**
   * 删除指定 id 的记录，幂等：不存在也不抛错
   */
  async delete(tableName: string, id: string): Promise<void> {
    const result = await this.drizzleDb.delete(this.tables[tableName]).where(sql`id = ${id}`).run();
    // 幂等删除：即使没找到也不抛错，直接 resolve
    // if (result.changes === 0) throw new Error(`Delete failed: user ${id} not found`);
    return;
  }

  async batch(tableName: string, operations: any[]): Promise<void> {
    for (const op of operations) {
      if (op.type === 'insert') await this.create(tableName, op.data);
      if (op.type === 'update') await this.update(tableName, op.id, op.data);
      if (op.type === 'delete') await this.delete(tableName, op.id);
    }
  }

  async executeRawQuery<R = any>(query: string, params?: any[]): Promise<R[]> {
    return this.db.prepare(query).all(params);
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    let query: any = this.drizzleDb.select({ count: sql`count(*)` }).from(this.tables[tableName]);
    if (filter) {
      for (const key in filter) {
        query = query.where(sql`${sql.raw('"' + key + '"')} = ${filter[key]}`);
      }
    }
    const res = await query.all();
    return Number(res[0]?.count ?? 0);
  }

  /**
   * 支持事务操作
   */
  async transaction<R>(fn: (tx: this) => Promise<R>): Promise<R> {
    // drizzle-orm transaction 支持
    return await this.drizzleDb.transaction(async (tx) => {
      // 用 tx 构造一个新的 client 实例，复用 schema/tables
      const txClient = new DrizzleSQLiteClient<T>('tx', this.tables, this.schemas);
      (txClient as any).drizzleDb = tx;
      (txClient as any).db = this.db;
      return await fn(txClient as this);
    });
  }

  async beginTransaction(): Promise<void> {
    // SQLite 单连接模式自动事务
    this.transactionActive = true;
  }

  async commitTransaction(): Promise<void> {
    this.transactionActive = false;
  }

  async rollbackTransaction(): Promise<void> {
    this.transactionActive = false;
  }

  /**
   * 获取当前客户端类型（如 indexeddb/sqlite/supabase 等）
   */
  public getType(): string {
    return 'drizzle-sqlite';
  }

  /**
   * 判断客户端是否已初始化
   */
  public isInitialized(): boolean {
    return !!this.initialized;
  }

  /**
   * 获取底层配置对象
   */
  public getConfig(): any {
    return {
      db: this.db,
      drizzleDb: this.drizzleDb,
      tables: this.tables,
      schemas: this.schemas,
    };
  }
}

// 注册到全局注册表
ClientRegistry.register('sqlite', 'drizzle', DrizzleSQLiteClient);

export default DrizzleSQLiteClient;
