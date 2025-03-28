import { DatabaseClient, PlatformDatabaseConfig } from '../interfaces';
import { User, Match, Message } from '../interfaces';

export class IndexedDBDatabaseClient implements DatabaseClient {
  private connected: boolean = false;
  private db?: IDBDatabase;
  private readonly dbName: string;
  private readonly dbVersion: number;

  constructor(private config: PlatformDatabaseConfig) {
    this.dbName = config.name;
    this.dbVersion = config.version;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.db = await this.openDatabase();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to IndexedDB:', error);
      throw error;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // 创建用户存储
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('email', 'email', { unique: true });
      userStore.createIndex('created_at', 'createdAt');
    }

    // 创建匹配存储
    if (!db.objectStoreNames.contains('matches')) {
      const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
      matchStore.createIndex('user_id1', 'userId1');
      matchStore.createIndex('user_id2', 'userId2');
      matchStore.createIndex('status', 'status');
      matchStore.createIndex('created_at', 'createdAt');
    }

    // 创建消息存储
    if (!db.objectStoreNames.contains('messages')) {
      const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
      messageStore.createIndex('match_id', 'matchId');
      messageStore.createIndex('sender_id', 'senderId');
      messageStore.createIndex('created_at', 'createdAt');
    }

    // 创建同步元数据存储
    if (!db.objectStoreNames.contains('sync_metadata')) {
      db.createObjectStore('sync_metadata', { keyPath: 'key' });
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      if (this.db) {
        this.db.close();
      }
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from IndexedDB:', error);
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
      // 简单的 SQL 解析和实现
      const storeName = this.getStoreNameFromSql(sql);
      if (!storeName) {
        return [];
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }

  private getStoreNameFromSql(sql: string): string | null {
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('users')) return 'users';
    if (sqlLower.includes('matches')) return 'matches';
    if (sqlLower.includes('messages')) return 'messages';
    return null;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }

    try {
      const storeName = this.getStoreNameFromSql(sql);
      if (!storeName) {
        return;
      }

      // 简单的 SQL 解析和实现
      if (sql.toLowerCase().includes('insert')) {
        await this.insert(storeName, params![0]);
      } else if (sql.toLowerCase().includes('update')) {
        await this.update(storeName, params![0]);
      } else if (sql.toLowerCase().includes('delete')) {
        await this.delete(storeName, params![0].id);
      }
    } catch (error) {
      console.error('Failed to execute statement:', error);
      throw error;
    }
  }

  private insert(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private update(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async beginTransaction(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }
    // IndexedDB 自动处理事务，不需要显式开始
  }

  async commit(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }
    // IndexedDB 自动处理事务，不需要显式提交
  }

  async rollback(): Promise<void> {
    if (!this.connected || !this.db) {
      throw new Error('Database not connected');
    }
    // IndexedDB 不支持事务回滚，需要手动实现
    throw new Error('Rollback not supported in IndexedDB');
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
      console.log('Syncing IndexedDB database...');
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
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction('sync_metadata', 'readonly');
        const store = transaction.objectStore('sync_metadata');
        const request = store.get('last_sync_timestamp');

        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? parseInt(result.value) : 0);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return 0;
    }
  }
} 