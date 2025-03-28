import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DatabaseClient, PlatformDatabaseConfig } from '../interfaces';

export class SQLiteDatabaseClient implements DatabaseClient {
  private connected: boolean = false;
  private connection?: SQLiteConnection;
  private db?: SQLiteDBConnection;

  constructor(private config: PlatformDatabaseConfig) {}

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // 初始化 SQLite 连接
      this.connection = new SQLiteConnection(CapacitorSQLite);
      
      // 创建数据库连接
      this.db = await this.connection.createConnection(
        this.config.name,
        false,
        'no-encryption',
        this.config.version,
        false
      );

      // 创建必要的表
      await this.createTables();
      
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    // 创建用户表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        profile_image TEXT,
        bio TEXT,
        preferences TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME
      )
    `);

    // 创建匹配表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user_id1 TEXT NOT NULL,
        user_id2 TEXT NOT NULL,
        status TEXT NOT NULL,
        matched_at DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME,
        FOREIGN KEY (user_id1) REFERENCES users(id),
        FOREIGN KEY (user_id2) REFERENCES users(id)
      )
    `);

    // 创建消息表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      if (this.db) {
        await this.db.close();
      }
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from SQLite database:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.db.query(sql, params || []);
      return result.values as T[];
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      await this.db.execute(sql, params || []);
    } catch (error) {
      console.error('Failed to execute statement:', error);
      throw error;
    }
  }

  async beginTransaction(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      await this.db.execute('BEGIN TRANSACTION');
    } catch (error) {
      console.error('Failed to begin transaction:', error);
      throw error;
    }
  }

  async commit(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      await this.db.execute('COMMIT');
    } catch (error) {
      console.error('Failed to commit transaction:', error);
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      await this.db.execute('ROLLBACK');
    } catch (error) {
      console.error('Failed to rollback transaction:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      // 实现数据同步逻辑
      // 1. 获取本地更改
      // 2. 获取远程更改
      // 3. 合并更改
      // 4. 更新本地数据库
      console.log('Syncing SQLite database...');
    } catch (error) {
      console.error('Failed to sync database:', error);
      throw error;
    }
  }

  async getLastSyncTimestamp(): Promise<number> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.db.query(
        'SELECT value FROM sync_metadata WHERE key = ?',
        ['last_sync_timestamp']
      );
      
      if (result.values && result.values.length > 0) {
        return parseInt(result.values[0].value);
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return 0;
    }
  }
} 