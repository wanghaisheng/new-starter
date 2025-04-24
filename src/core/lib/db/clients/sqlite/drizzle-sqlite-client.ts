import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { drizzleSchema } from '@/core/lib/db/schema/drizzle-schema';
import { migrationSQL } from '@/core/lib/db/schema/drizzle-schema';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { ColumnType } from '@/core/lib/db/schema/types';
import { TableSchema } from '@/core/lib/db/schema/types';

/**
 * DrizzleSQLiteClient: 基于 drizzle-orm 的 SQLite Client
 * 用于自动建表、基础 CRUD，兼容 TableSchema
 */
export class DrizzleSQLiteClient extends BaseClient {
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
  private prepareRow<T>(tableName: string, data: Partial<T>): Partial<T> {
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
        row[col.name] = value === true ? 1 : 0;
      } else if (typeStr === 'datetime' || typeStr === 'date') {
        row[col.name] = value instanceof Date ? value.toISOString() : value;
      } else if (typeStr === 'json') {
        // 只要不是字符串，全部 JSON.stringify
        row[col.name] = typeof value === 'string' ? value : JSON.stringify(value ?? {});
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

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    const row = this.prepareRow(tableName, data);
    Object.entries(row).forEach(([k, v]) => {
      console.log(`[DrizzleSQLiteClient.create][after prepareRow] ${String(k)}:`, v, 'type:', typeof v, '| isArray:', Array.isArray(v), '| constructor:', v && v.constructor ? v.constructor.name : 'null');
    });
    await this.drizzleDb.insert(this.tables[tableName]).values(row).run();
    return data;
  }

  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    await this.drizzleDb.update(this.tables[tableName])
      .set(this.prepareRow(tableName, data))
      .where(sql`id = ${id}`)
      .run();
  }

  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    const rows = await this.drizzleDb.select().from(this.tables[tableName]).where(sql`id = ${id}`).all();
    return rows[0] || null;
  }

  async findAll<T extends BaseEntity>(tableName: string, filter?: Partial<T>): Promise<T[]> {
    let query = this.drizzleDb.select().from(this.tables[tableName]);
    if (filter) {
      const conditions = Object.entries(filter)
        .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
        .reduce((prev, curr) => prev ? sql`${prev} AND ${curr}` : curr, undefined);
      if (conditions) {
        query = query.where(conditions);
      }
    }
    return await query.all();
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.drizzleDb.delete(this.tables[tableName]).where(sql`id = ${id}`).run();
  }

  async query(tableName: string, options: any): Promise<{ items: any[] }> {
    let query = this.drizzleDb.select().from(this.tables[tableName]);
    if (options?.where) {
      const conditions = Object.entries(options.where)
        .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
        .reduce((prev, curr) => prev ? sql`${prev} AND ${curr}` : curr, undefined);
      if (conditions) {
        query = query.where(conditions);
      }
    }
    const items = await query.all();
    return { items };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    let query = this.drizzleDb.select({ count: sql`count(*)` }).from(this.tables[tableName]);
    if (filter) {
      const conditions = Object.entries(filter)
        .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
        .reduce((prev, curr) => prev ? sql`${prev} AND ${curr}` : curr, undefined);
      if (conditions) {
        query = query.where(conditions);
      }
    }
    const res = await query.all();
    return res[0]?.count ?? 0;
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
}

export default DrizzleSQLiteClient;
