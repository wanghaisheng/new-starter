import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { TableSchema, ColumnType } from '@/core/lib/db/schema/types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * KyselySQLiteClient: 基于 Kysely 的 SQLite Client，自动建表，类型安全，兼容你的 TableSchema
 */
export class KyselySQLiteClient {
  private db: Kysely<any>;
  private sqliteDb: any; // better-sqlite3 实例
  private schemas: TableSchema[];

  constructor(dbFile: string, schemas: TableSchema[]) {
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

  async create<T extends BaseEntity>(table: string, data: T): Promise<T> {
    const row = this.prepareRow(table, data);
    await this.db.insertInto(table).values(row).execute();
    return row as T;
  }

  async update<T extends BaseEntity>(table: string, id: string, data: Partial<T>): Promise<void> {
    const row = this.prepareRow(table, data);
    await this.db.updateTable(table).set(row).where('id', '=', id).execute();
  }

  // 辅助：按 schema 自动转换 boolean/date/json
  private prepareRow<T>(table: string, data: Partial<T>): Partial<T> {
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

  async findById<T extends BaseEntity>(table: string, id: string): Promise<T | null> {
    const result = await this.db.selectFrom(table).selectAll().where('id', '=', id).executeTakeFirst();
    return result ? (result as T) : null;
  }

  async findAll<T extends BaseEntity>(table: string, filter?: Record<string, any>): Promise<T[]> {
    let query = this.db.selectFrom(table).selectAll();
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        query = query.where(key as any, '=', value);
      }
    }
    const rows = await query.execute();
    return rows as T[];
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

  // 支持简单 where 查询（字段名自动映射 schema，彻底避免大小写问题）
  async query(table: string, query: { where?: Record<string, any> }): Promise<{ items: any[] }> {
    let kyselyQuery = this.db.selectFrom(table).selectAll();
    // 字段名严格映射 schema，避免大小写和拼写导致查不到
    const schema = this.schemas.find(s => s.name === table);
    let mappedWhere: Record<string, any> = {};
    if (schema && query && query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        const col = schema.columns.find(c => c.name.toLowerCase() === key.toLowerCase());
        if (col) mappedWhere[col.name] = value;
        else mappedWhere[key] = value;
      }
    } else if (query && query.where) {
      mappedWhere = { ...query.where };
    }
    if (Object.keys(mappedWhere).length > 0) {
      for (const [key, value] of Object.entries(mappedWhere)) {
        if (value === null) {
          kyselyQuery = kyselyQuery.where(key as any, 'is', null);
        } else if (value === undefined) {
          kyselyQuery = kyselyQuery.where(key as any, 'is not', null);
        } else {
          kyselyQuery = kyselyQuery.where(key as any, '=', value);
        }
      }
    }
    const rows = await kyselyQuery.execute();
    console.log('[Kysely query]', table, mappedWhere, rows);
    // 彻底调试：输出所有表内容
    const allRows = await this.db.selectFrom(table).selectAll().execute();
    console.log('[Kysely all rows]', table, allRows);
    // 进一步调试：原生 SQL 查询 email
    if (mappedWhere.email && this.sqliteDb) {
      try {
        const stmt = this.sqliteDb.prepare(`SELECT * FROM ${table} WHERE email = ?`);
        const sqlRows = stmt.all(mappedWhere.email);
        console.log('[Raw SQL]', table, mappedWhere.email, sqlRows);
      } catch (e) {
        console.error('[Raw SQL ERROR]', e);
      }
    }
    // 兼容：无论什么情况都只返回 { items: User[] }
    let safeRows: any[] = [];
    if (Array.isArray(rows)) safeRows = rows;
    else if (rows) safeRows = [rows];
    // debug
    console.log('[DEBUG query return]', { items: safeRows });
    return { items: safeRows };
  }
}

export default KyselySQLiteClient;
