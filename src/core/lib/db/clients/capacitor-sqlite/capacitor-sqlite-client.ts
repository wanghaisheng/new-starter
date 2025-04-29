import {
  QueryOptions,
  QueryResult,
  BatchOperation,
  DatabaseConfig,
  StorageStats,
  DatabaseError,
  createDatabaseError,
  DatabaseErrorCode
} from '@/core/lib/db/types/database';
import {DatabaseEventCode} from "@/core/lib/db/types/common"
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { BaseClient } from '@/core/lib/db/clients/base-client';

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

/**
 * Capacitor SQLite 数据库客户端
 * 用于移动端的SQLite存储
 */
export class CapacitorSQLiteClient<T extends BaseEntity = any> extends BaseClient<T> {
  private db: SQLiteDBConnection | undefined;
  private sqlite: SQLiteConnection | undefined;
  private config: DatabaseConfig;
  private dbName: string;
  private dbPath: string;

  // 兼容基类 protected 属性
  protected logger = (this as any).logger;
  protected initialized = false;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name || 'appdb';
    if (
      config.storage &&
      config.storage.offline &&
      config.storage.offline.type === 'capacitor-sqlite' &&
      config.storage.offline.path
    ) {
      this.dbPath = config.storage.offline.path;
    } else if (typeof config.path === 'string' && config.path) {
      this.dbPath = config.path;
    } else {
      this.dbPath = this.dbName;
    }
    this.logger.info(`[CapacitorSQLiteClient] 配置已加载: dbName=${this.dbName}, dbPath=${this.dbPath}`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('CapacitorSQLiteClient 已初始化');
      return;
    }
    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();
      this.initialized = true;
      this.logger.info('CapacitorSQLiteClient 初始化完成');
    } catch (err) {
      this.logger.error('CapacitorSQLiteClient 初始化失败', err);
      throw createDatabaseError(DatabaseErrorCode.INITIALIZATION_ERROR, `Failed to open database: ${err}`, err);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        await this.sqlite?.closeConnection(this.dbName, false);
        this.db = undefined;
        this.initialized = false;
        this.logger.info('CapacitorSQLiteClient 已关闭');
      } catch (err) {
        this.logger.error('CapacitorSQLiteClient 关闭失败', err);
        throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, `Failed to close database: ${err}`, err);
      }
    }
  }

  async connect(): Promise<void> {
    await this.initialize();
  }

  async disconnect(): Promise<void> {
    await this.close();
  }

  async findById(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    // 使用 run 执行参数绑定的 select
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    const res = await this.db.query(sql.replace('?', `'${id}'`));
    if (res.values && res.values.length > 0) {
      return res.values[0] as T;
    }
    return null;
  }

  async getStats(): Promise<StorageStats> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    // SQLite 无法直接获取文件大小，需借助 Capacitor Filesystem 插件或平台 API
    // 这里只返回 0，实际项目可根据 dbPath 查询文件大小
    return { totalSize: 0, availableSpace: 0, usedSpace: 0 };
  }

  async getDatabaseVersion(): Promise<number> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    // 通过 PRAGMA user_version 获取版本号
    const res = await this.db.query('PRAGMA user_version');
    return res.values?.[0]?.user_version ?? 1;
  }

  async getTableNames(): Promise<string[]> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    const res = await this.db.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
    return (res.values ?? []).map((row: any) => row.name);
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    const tableNames = await this.getTableNames();
    for (const table of tableNames) {
      await this.db.execute(`DELETE FROM "${table}"`);
    }
    this.logger.info('CapacitorSQLiteClient 数据库已清空');
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    let sql = `SELECT * FROM ${tableName}`;
    if (filter && Object.keys(filter).length > 0) {
      const where = Object.keys(filter).map(k => `${k} = '${filter[k]}'`).join(' AND ');
      sql += ` WHERE ${where}`;
    }
    const res = await this.db.query(sql);
    return (res.values ?? []) as T[];
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (filter && Object.keys(filter).length > 0) {
      const where = Object.keys(filter).map(k => `${k} = '${filter[k]}'`).join(' AND ');
      sql += ` WHERE ${where}`;
    }
    const res = await this.db.query(sql);
    return res.values?.[0]?.count ?? 0;
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    await this.db.execute('BEGIN TRANSACTION');
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    await this.db.execute('COMMIT');
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    await this.db.execute('ROLLBACK');
  }

  async isTransactionActive(): Promise<boolean> {
    // Capacitor SQLite 不直接暴露事务状态，需自行维护
    // 这里简单返回 false
    return false;
  }

  // 简单事件监听实现
  protected eventListeners: Map<DatabaseEventCode, Function[]> = new Map();

  async addEventListener(event: DatabaseEventCode, listener: Function): Promise<void> {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  async removeEventListener(event: DatabaseEventCode, listener: Function): Promise<void> {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    // 只支持无参数的原生 SQL 查询
    if (/^select/i.test(query.trim())) {
      const res = await this.db.query(query);
      return res.values;
    } else {
      try {
        await this.db.execute(query);
        return undefined;
      } catch (err) {
        throw createDatabaseError(DatabaseErrorCode.QUERY_ERROR, `Failed to execute SQL: ${err}`, err);
      }
    }
  }

  async create(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(',');
    const sql = `INSERT INTO ${tableName} (${fields.join(',')}) VALUES (${placeholders})`;
    try {
      await this.db.run(sql, Object.values(data));
      return data;
    } catch (err) {
      throw createDatabaseError(DatabaseErrorCode.QUERY_ERROR, `Failed to execute SQL: ${err}`, err);
    }
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    const fields = Object.keys(data);
    const setClause = fields.map(k => `${k} = ?`).join(',');
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    try {
      await this.db.run(sql, [...Object.values(data), id]);
    } catch (err) {
      throw createDatabaseError(DatabaseErrorCode.QUERY_ERROR, `Failed to execute SQL: ${err}`, err);
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    try {
      await this.db.run(sql, [id]);
    } catch (err) {
      throw createDatabaseError(DatabaseErrorCode.QUERY_ERROR, `Failed to execute SQL: ${err}`, err);
    }
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    if (!this.db) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    // 只支持无过滤条件的全表查询，如需复杂查询请扩展
    const res = await this.db.query(`SELECT * FROM ${tableName}`);
    return { items: (res.values ?? []) as T[], total: res.values?.length ?? 0 };
  }

  async batch(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    for (const op of operations) {
      switch (op.type) {
        case 'add':
        case 'put':
          await this.create(tableName, op.data);
          break;
        case 'update':
          if (!('id' in op)) throw new Error('Batch update operation missing id');
          await this.update(tableName, (op as any).id, op.data);
          break;
        case 'delete':
          if (!('id' in op)) throw new Error('Batch delete operation missing id');
          await this.delete(tableName, (op as any).id);
          break;
      }
    }
    this.logger.info('Batch operation completed', { tableName, count: operations.length });
  }

  getType(): string { return 'capacitor-sqlite'; }
  isInitialized(): boolean { return !!this.db; }
  getConfig(): DatabaseConfig { return this.config; }

  protected checkInitialized(): void {
    if (!this.initialized) throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
  }
}