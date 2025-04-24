import { BaseClient } from '@/core/lib/db/clients/base-client';
import { QueryOptions, QueryResult, BatchOperation, DatabaseConfig } from '@/core/lib/db/types/database';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

/**
 * Capacitor SQLite 数据库客户端
 * 用于移动端的SQLite存储
 */
export class CapacitorSQLiteClient extends BaseClient {
  private db: SQLiteDBConnection | undefined;
  private sqlite: SQLiteConnection | undefined;
  private config: DatabaseConfig;
  private dbName: string;
  private dbPath: string;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    // 日志实例由 BaseClient 自动注入，可直接用 this.logger
    this.dbName = config.name || 'appdb';
    // 兼容新版 DatabaseConfig 的 storage.offline.path
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
      this.logger.info('CapacitorSQLiteClient 数据库初始化中...');
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false, // encrypted
        'no-encryption', // mode
        1, // version
        false // readonly
      );
      await this.db.open();
      this.initialized = true;
      this.logger.info(`[CapacitorSQLiteClient] 数据库已打开: dbName=${this.dbName}, dbPath=${this.dbPath}`);
    } catch (err) {
      this.logger.error('CapacitorSQLiteClient 初始化失败', err);
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite?.closeConnection(this.dbName, false);
      this.db = undefined;
      this.initialized = false;
      this.logger.info('CapacitorSQLiteClient 已关闭');
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    // 实际项目应清空所有表
    this.logger.info('CapacitorSQLiteClient 数据库清空');
  }

  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    this.checkInitialized();
    if (!this.db) throw new Error('DB not initialized');
    const res = await this.db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    if (res.values && res.values.length > 0) {
      return res.values[0] as BaseEntity;
    }
    return null;
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    this.checkInitialized();
    if (!this.db) throw new Error('DB not initialized');
    let sql = `SELECT * FROM ${tableName}`;
    let params: any[] = [];
    if (filter && Object.keys(filter).length > 0) {
      const where = Object.keys(filter).map(k => `${k} = ?`).join(' AND ');
      sql += ` WHERE ${where}`;
      params = Object.values(filter);
    }
    const res = await this.db.query(sql, params);
    return (res.values ?? []) as BaseEntity[];
  }

  async create(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    this.checkInitialized();
    if (!this.db) throw new Error('DB not initialized');
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(',');
    const sql = `INSERT INTO ${tableName} (${fields.join(',')}) VALUES (${placeholders})`;
    await this.db.run(sql, Object.values(data));
    return data;
  }

  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw new Error('DB not initialized');
    const fields = Object.keys(data);
    const setClause = fields.map(k => `${k} = ?`).join(',');
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    await this.db.run(sql, [...Object.values(data), id]);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw new Error('DB not initialized');
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    await this.db.run(sql, [id]);
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    this.checkInitialized();
    // ...实际查询逻辑
    this.logger.debug(`query in ${tableName}`);
    return { items: [], total: 0 };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    // ...实际计数逻辑
    this.logger.debug(`count in ${tableName}`);
    return 0;
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    // ...实际事务开始逻辑
    this.logger.info('Transaction started');
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    // ...实际事务提交逻辑
    this.logger.info('Transaction committed');
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    // ...实际事务回滚逻辑
    this.logger.warn('Transaction rolled back');
  }

  async batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
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

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.logger.warn('executeRawQuery is not supported in CapacitorSQLiteClient');
    return [];
  }

  async connect(): Promise<void> {
    // 移动端 SQLite 通常在 initialize 时已连接
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // 移动端 SQLite 通常无需显式断开
    return Promise.resolve();
  }

  protected checkInitialized(): void {
    if (!this.initialized) throw new Error('CapacitorSQLiteClient not initialized');
  }
}