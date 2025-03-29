import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { IDatabaseClient, IDatabaseTransaction } from '../../interfaces';
import { BaseEntity } from '../../types/base-entity';
import { DatabaseConfig, QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { User, Match, Message } from '../../types';
import { SQLiteStorageManager } from './storage-manager';
import { SQLitePerformanceManager } from './performance-manager';
import { SQLiteErrorManager } from './error-manager';
import { SQLiteMigrationManager, Migration } from './migration-manager';

/**
 * SQLite 数据库客户端
 * 使用 Capacitor SQLite 实现
 */
export class SQLiteClient implements IDatabaseClient {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;
  private config: DatabaseConfig;
  private storageManager: SQLiteStorageManager | null = null;
  private performanceManager: SQLitePerformanceManager | null = null;
  private errorManager: SQLiteErrorManager | null = null;
  private migrationManager: SQLiteMigrationManager | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * 获取数据库连接
   * @throws Error 如果数据库未初始化
   */
  getConnection(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 检查 SQLite 是否可用
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = await this.sqlite.isConnection(this.config.name, false);

      if (ret.result && isConn.result) {
        this.db = await this.sqlite.retrieveConnection(this.config.name, false);
      } else {
        // 使用加密模式创建数据库连接
        const encryptionKey = this.config.encryptionKey || 'no-encryption';
        this.db = await this.sqlite.createConnection(
          this.config.name,
          false,
          encryptionKey,
          this.config.version,
          false
        );
      }

      await this.db.open();
      this.initialized = true;

      // 初始化存储管理器
      this.storageManager = new SQLiteStorageManager(this.db, {
        maxSize: 100 * 1024 * 1024, // 100MB
        cleanupThreshold: 80, // 80%
        retentionDays: 30 // 30天
      });

      // 初始化性能管理器
      this.performanceManager = new SQLitePerformanceManager(this.db, {
        batchSize: 100,
        cacheSize: 2000,
        queryTimeout: 5 * 60 * 1000, // 5分钟
        enableWAL: true
      });
      await this.performanceManager.initialize();

      // 初始化错误管理器
      this.errorManager = new SQLiteErrorManager(this.db, {
        backupInterval: 24 * 60 * 60 * 1000, // 24小时
        maxBackups: 7, // 保留7个备份
        autoRecover: true
      });
      await this.errorManager.initialize();

      // 初始化迁移管理器
      this.migrationManager = new SQLiteMigrationManager(this.db);
      
      // 执行迁移
      await this.migrationManager.migrate();

      // 创建表
      await this.createTables();

      // 检查存储状态
      const needsCleanup = await this.storageManager.checkStorageStatus();
      if (needsCleanup) {
        await this.storageManager.cleanupExpiredData();
      }
    } catch (error) {
      console.error('SQLite initialization error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.config.name, false);
      this.db = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const tables = await this.db.query('SELECT name FROM sqlite_master WHERE type="table"');
      if (tables.values) {
        for (const table of tables.values) {
          await this.db.execute(`DROP TABLE IF EXISTS ${table.name}`);
        }
      }
      await this.createTables();
    } catch (error) {
      console.error('SQLite clear error:', error);
      throw error;
    }
  }

  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.query(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      );

      if (result.values && result.values.length > 0) {
        return this.mapRowToEntity<T>(result.values[0]);
      }
      return null;
    } catch (error) {
      console.error('SQLite findById error:', error);
      throw error;
    }
  }

  async findAll<T extends BaseEntity>(
    tableName: string,
    filter?: Record<string, any>
  ): Promise<T[]> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `SELECT * FROM ${tableName}`;
      const params: any[] = [];

      if (filter) {
        const conditions = Object.entries(filter).map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.db.query(query, params);
      return result.values ? result.values.map(row => this.mapRowToEntity<T>(row)) : [];
    } catch (error) {
      console.error('SQLite findAll error:', error);
      throw error;
    }
  }

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 检查存储空间
      if (this.storageManager) {
        const hasSpace = await this.storageManager.hasEnoughSpace(1024); // 假设每条记录至少需要1KB
        if (!hasSpace) {
          await this.storageManager.cleanupExpiredData();
          // 再次检查空间
          const hasSpaceAfterCleanup = await this.storageManager.hasEnoughSpace(1024);
          if (!hasSpaceAfterCleanup) {
            throw new Error('Insufficient storage space');
          }
        }
      }

      const now = new Date();
      const entity = {
        ...data,
        createdAt: now,
        updatedAt: now
      };

      const columns = Object.keys(entity);
      const values = Object.values(entity);
      const placeholders = values.map(() => '?').join(', ');

      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      await this.db.run(query, values, true);

      return entity;
    } catch (error) {
      console.error('SQLite create error:', error);
      throw error;
    }
  }

  async update<T extends BaseEntity>(
    tableName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const updates = Object.entries(data)
        .map(([key]) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(data), new Date(), id];

      const query = `UPDATE ${tableName} SET ${updates}, updatedAt = ? WHERE id = ?`;
      await this.db.run(query, values, true);
    } catch (error) {
      console.error('SQLite update error:', error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], true);
    } catch (error) {
      console.error('SQLite delete error:', error);
      throw error;
    }
  }

  async query<T extends BaseEntity>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `SELECT * FROM ${tableName}`;
      const params: any[] = [];

      // 处理条件
      if (options.where) {
        const conditions = Object.entries(options.where).map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      // 处理排序
      if (options.orderBy) {
        const [column, direction] = Array.isArray(options.orderBy)
          ? options.orderBy
          : [options.orderBy, 'ASC'];
        query += ` ORDER BY ${column} ${direction}`;
      }

      // 处理分页
      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      // 使用性能管理器优化查询
      const result = this.performanceManager
        ? await this.performanceManager.optimizeQuery(query, params)
        : await this.db.query(query, params);

      const total = await this.getTotalCount(tableName, options.where);

      return {
        data: result.values ? result.values.map((row: any) => this.mapRowToEntity<T>(row)) : [],
        total,
        hasMore: options.limit ? total > (options.offset || 0) + options.limit : false
      };
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  async batch<T extends BaseEntity>(
    tableName: string,
    operations: BatchOperation<T>[]
  ): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const set: { statement: string; values: any[] }[] = [];

      for (const operation of operations) {
        switch (operation.type) {
          case 'add':
            const columns = Object.keys(operation.data);
            const values = Object.values(operation.data);
            const placeholders = values.map(() => '?').join(', ');
            set.push({
              statement: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
              values
            });
            break;
          case 'put':
            const updates = Object.entries(operation.data)
              .map(([key]) => `${key} = ?`)
              .join(', ');
            const updateValues = [...Object.values(operation.data), operation.data.id];
            set.push({
              statement: `UPDATE ${tableName} SET ${updates} WHERE id = ?`,
              values: updateValues
            });
            break;
          case 'delete':
            set.push({
              statement: `DELETE FROM ${tableName} WHERE id = ?`,
              values: [operation.data.id]
            });
            break;
        }
      }

      // 使用性能管理器优化批量操作
      if (this.performanceManager) {
        await this.performanceManager.optimizeBatch(set);
      } else {
        await this.db.executeSet(set);
      }
    } catch (error) {
      console.error('SQLite batch error:', error);
      throw error;
    }
  }

  async transaction<T>(
    callback: (transaction: IDatabaseTransaction) => Promise<T>
  ): Promise<T> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute('BEGIN TRANSACTION');
      const result = await callback(this);
      await this.db.execute('COMMIT');
      return result;
    } catch (error) {
      await this.db.execute('ROLLBACK');
      console.error('SQLite transaction error:', error);
      throw error;
    }
  }

  async executeRawQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.query(query, params);
      return result.values || [];
    } catch (error) {
      console.error('SQLite raw query error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 创建用户表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          photoUrl TEXT,
          bio TEXT,
          interests TEXT,
          birthDate TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `);

      // 创建匹配表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          matchedUserId TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (matchedUserId) REFERENCES users(id)
        )
      `);

      // 创建消息表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          senderId TEXT NOT NULL,
          receiverId TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (senderId) REFERENCES users(id),
          FOREIGN KEY (receiverId) REFERENCES users(id)
        )
      `);
    } catch (error) {
      console.error('SQLite create tables error:', error);
      throw error;
    }
  }

  private async getTotalCount(
    tableName: string,
    where?: Record<string, any>
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];

      if (where) {
        const conditions = Object.entries(where).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const operator = Object.keys(value)[0];
            const val = value[operator];
            params.push(val);
            return `${key} ${operator} ?`;
          }
          params.push(value);
          return `${key} = ?`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.db.query(query, params);
      return result.values ? result.values[0].count : 0;
    } catch (error) {
      console.error('SQLite getTotalCount error:', error);
      throw error;
    }
  }

  private mapRowToEntity<T extends BaseEntity>(row: any): T {
    const entity = { ...row } as T;
    
    // 转换日期字段
    if (entity.createdAt) {
      entity.createdAt = new Date(entity.createdAt);
    }
    if (entity.updatedAt) {
      entity.updatedAt = new Date(entity.updatedAt);
    }

    // 转换 JSON 字符串字段
    if ('interests' in entity) {
      const interests = entity.interests as string;
      (entity as any).interests = JSON.parse(interests);
    }

    // 转换 birthDate 字段
    if ('birthDate' in entity) {
      const birthDate = entity.birthDate as string;
      (entity as any).birthDate = new Date(birthDate);
    }

    return entity;
  }

  // 通用实体操作方法
  async findUsers(query?: any): Promise<User[]> {
    return this.findAll<User>('users', query);
  }

  async findMatches(query?: any): Promise<Match[]> {
    return this.findAll<Match>('matches', query);
  }

  async findMessages(query?: any): Promise<Message[]> {
    return this.findAll<Message>('messages', query);
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.create<User>('users', user);
  }

  async createMatch(data: Omit<Match, 'id'>): Promise<Match> {
    const match: Match = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.create<Match>('matches', match);
  }

  async createMessage(data: Omit<Message, 'id'>): Promise<Message> {
    const message: Message = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.create<Message>('messages', message);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update<User>('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update<Match>('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update<Message>('messages', id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete('users', id);
  }

  async deleteMatch(id: string): Promise<void> {
    return this.delete('matches', id);
  }

  async deleteMessage(id: string): Promise<void> {
    return this.delete('messages', id);
  }

  // 事务支持
  async beginTransaction(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.db) throw new Error('Database not initialized');
    await this.db.rollbackTransaction();
  }

  // 计数方法
  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    return this.getTotalCount(tableName, filter);
  }

  /**
   * 添加数据库迁移
   */
  addMigration(migration: Migration): void {
    if (!this.migrationManager) {
      throw new Error('Migration manager not initialized');
    }
    this.migrationManager.addMigration(migration);
  }

  /**
   * 回滚数据库迁移
   */
  async rollbackMigration(steps: number = 1): Promise<void> {
    if (!this.migrationManager) {
      throw new Error('Migration manager not initialized');
    }
    await this.migrationManager.rollback(steps);
  }

  /**
   * 重置数据库
   */
  async resetDatabase(): Promise<void> {
    if (!this.migrationManager) {
      throw new Error('Migration manager not initialized');
    }
    await this.migrationManager.reset();
  }
}