import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { TableSchema, ColumnType } from '@/core/lib/db/schema/types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { BaseClient } from '@/core/lib/db/clients/base-client';

/**
 * KyselySQLiteClient: 基于 Kysely 的 SQLite Client，自动建表，类型安全，兼容你的 TableSchema
 */
export class KyselySQLiteClient<T extends BaseEntity> extends BaseClient<T> {
  private db: Kysely<any>;
  private sqliteDb: any; // better-sqlite3 实例
  private schemas: TableSchema[];

  constructor(dbFile: string, schemas: TableSchema[]) {
    super();
    this.sqliteDb = new Database(dbFile);
    const dialect = new SqliteDialect({
      database: this.sqliteDb,
    });
    this.db = new Kysely<any>({ dialect });
    this.schemas = schemas;
  }

  /**
   * 自动建表
   */
  async initialize(): Promise<void> {
    // 直接用 this.sqliteDb 执行建表
    for (const schema of this.schemas) {
      const columns = schema.columns.map(col => {
        let type = 'TEXT';
        switch (col.type) {
          case ColumnType.STRING:
          case ColumnType.TEXT:
            type = 'TEXT'; break;
          case ColumnType.DATETIME:
          case ColumnType.DATE:
            type = 'TEXT'; break;
          case ColumnType.BOOLEAN:
            type = 'INTEGER'; break;
          case ColumnType.NUMBER:
            type = 'INTEGER'; break;
          case ColumnType.JSON:
            type = 'TEXT'; break;
          case ColumnType.BLOB:
            type = 'BLOB'; break;
          default:
            type = 'TEXT';
        }
        let sql = `\`${col.name}\` ${type}`;
        if (col.primaryKey) sql += ' PRIMARY KEY';
        if (col.notNull) sql += ' NOT NULL';
        if (col.unique) sql += ' UNIQUE';
        return sql;
      });
      const createTableSQL = `CREATE TABLE IF NOT EXISTS \`${schema.name}\` (${columns.join(', ')})`;
      this.sqliteDb.exec(createTableSQL);
    }
  }

  async findById(table: string, id: string): Promise<T | null> {
    const rows = await this.db.selectFrom(table).selectAll().where('id', '=', id).execute();
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as T) : null;
  }

  async findAll(table: string, filter?: Record<string, any>): Promise<T[]> {
    let query: any = this.db.selectFrom(table).selectAll();
    if (filter) {
      for (const key in filter) {
        query = (query as any).where(key, '=', filter[key]);
      }
    }
    const rows = await query.execute();
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  async create(table: string, data: T): Promise<T> {
    const row = this.prepareRow(table, data as any);
    await this.db.insertInto(table).values(row).execute();
    return row as T;
  }

  async update(table: string, id: string, data: Partial<T>): Promise<void> {
    const row = this.prepareRow(table, data as any);
    await this.db.updateTable(table).set(row).where('id', '=', id).execute();
  }

  async query(table: string, options: any): Promise<{ items: T[]; data?: T[] }> {
    let query: any = this.db.selectFrom(table).selectAll();
    if (options?.where) {
      for (const key in options.where) {
        query = (query as any).where(key, '=', options.where[key]);
      }
    }
    if (options?._limit) query = (query as any).limit(options._limit);
    if (options?._offset) query = (query as any).offset(options._offset);
    // Kysely 没有 orderBy 字符串解析，这里略过
    const rows = await query.execute();
    return { items: Array.isArray(rows) ? (rows as T[]) : [] };
  }

  async batch(table: string, operations: any[]): Promise<void> {
    for (const op of operations) {
      if (op.type === 'insert') await this.create(table, op.data);
      if (op.type === 'update') await this.update(table, op.id, op.data);
      if (op.type === 'delete') await this.delete(table, op.id);
    }
  }

  async executeRawQuery<R = any>(query: string, params?: any[]): Promise<R[]> {
    // Kysely 不直接支持原生 SQL 参数绑定，转交给 better-sqlite3
    return this.sqliteDb.prepare(query).all(params);
  }

  // 辅助：按 schema 自动转换 boolean/date/json
  private prepareRow(table: string, data: Partial<T>): Partial<T> {
    const schema = this.schemas.find(s => s.name === table);
    if (!schema) return data;
    const row: Record<string, any> = { ...data };
    for (const col of schema.columns) {
      if (!(col.name in row)) continue;
      const value = row[col.name];
      if (value === undefined) { row[col.name] = null; continue; }
      switch (col.type) {
        case ColumnType.BOOLEAN: row[col.name] = value === true ? 1 : 0; break;
        case ColumnType.DATETIME:
        case ColumnType.DATE:
          row[col.name] = value instanceof Date ? value.toISOString() : value; break;
        case ColumnType.JSON: row[col.name] = typeof value === 'string' ? value : JSON.stringify(value); break;
        default: break;
      }
    }
    return row as Partial<T>;
  }

  async delete(table: string, id: string): Promise<void> {
    await this.db.deleteFrom(table).where('id', '=', id).execute();
  }

  async clear(): Promise<void> {
    for (const schema of this.schemas) {
      await this.db.deleteFrom(schema.name).execute();
    }
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }

  // --- BaseClient required methods ---
  async connect(): Promise<void> {
    // For better-sqlite3, connection is handled in constructor
    // No-op for compatibility
  }

  async disconnect(): Promise<void> {
    await this.close();
  }

  async count(table: string, filter?: Record<string, any>): Promise<number> {
    let query: any = this.db.selectFrom(table).select((eb) => [
      eb.fn.count('id').as('count')
    ]);
    if (filter) {
      for (const key in filter) {
        query = (query as any).where(key, '=', filter[key]);
      }
    }
    const res = await query.execute();
    return Number(res[0]?.count ?? 0);
  }

  async beginTransaction(): Promise<void> {
    // Kysely handles transactions via .transaction(), but for interface compatibility:
    // No-op
  }

  async commitTransaction(): Promise<void> {
    // No-op for compatibility
  }

  async rollbackTransaction(): Promise<void> {
    // No-op for compatibility
  }

  // --- End of BaseClient required methods ---
}

export default KyselySQLiteClient;
