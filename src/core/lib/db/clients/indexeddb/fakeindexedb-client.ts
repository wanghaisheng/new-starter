import {
  indexedDB as fakeIndexedDB,
  IDBKeyRange,
  IDBDatabase,
  IDBTransaction,
  IDBOpenDBRequest
} from 'fake-indexeddb';
import {
  QueryOptions,
  QueryResult,
  BatchOperation,
  StorageStats,
  BaseEntity,
  DatabaseConfig,
  OfflineStorageConfig,
  DatabaseError,
  DatabaseErrorCode,
  DatabaseEvent
} from '@/core/lib/db/types/database';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { schemaRegistry } from '@/core/lib/db/schema/schema-registry-singleton';
import { ClientRegistry } from '@/core/services/data/adapters/client-registry';

/**
 * Node.js/测试环境专用 IndexedDB 客户端（不依赖 idb，仅用 fake-indexeddb 原生 API）。
 */
export class FakeIndexedDBClient<T extends BaseEntity> extends BaseClient {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name;
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const request = fakeIndexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        // 动态创建所有表结构
        const schemas = schemaRegistry.getAllSchemas('offline');
        for (const schema of schemas) {
          if (!db.objectStoreNames.contains(schema.name)) {
            db.createObjectStore(schema.name, { keyPath: 'id' });
          }
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ---- 修正 checkInitialized 为 protected，兼容基类 ----
  protected checkInitialized() {
    if (!this.db) throw this.createError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Database not initialized');
  }

  // ---- 修正 createError 为 protected，兼容基类 ----
  protected createError(code: DatabaseErrorCode | string, message: string, details?: any): DatabaseError {
    const error = new Error(message) as DatabaseError;
    error.name = 'DatabaseError';
    error.code = code;
    if (details) error.details = details;
    return error;
  }

  async create(tableName: string, data: T): Promise<void> {
    this.checkInitialized();
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const now = new Date().toISOString();
      const req = store.add({ ...data, createdAt: now, updatedAt: now });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (!existing) {
          reject(this.createError(DatabaseErrorCode.NOT_FOUND, `Record not found with ID: ${id}`));
          return;
        }
        const updatedData = {
          ...existing,
          ...data,
          id,
          updatedAt: new Date().toISOString()
        };
        const putReq = store.put(updatedData);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    return new Promise<QueryResult<T>>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.getAll();
      req.onsuccess = () => {
        let results = req.result as T[];
        if (options.where) {
          results = results.filter(item => this.matchesFilter(item, options.where as Partial<T>));
        }
        if (options.orderBy) {
          const { field, direction } = options.orderBy;
          results.sort((a, b) => {
            if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
            if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
        if (options.offset) {
          results = results.slice(options.offset);
        }
        if (options.limit) {
          results = results.slice(0, options.limit);
        }
        resolve({ items: results });
      };
      req.onerror = () => reject(req.error);
    });
  }

  private matchesFilter(item: any, where: Partial<T>): boolean {
    for (const key in where) {
      if (where[key] !== undefined && item[key] !== where[key]) {
        return false;
      }
    }
    return true;
  }

  async batch(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      let pending = operations.length;
      if (pending === 0) resolve();
      for (const op of operations) {
        let req: IDBRequest;
        if (op.type === 'add') {
          req = store.add(op.data);
        } else if (op.type === 'put' || op.type === 'update') {
          req = store.put(op.data);
        } else if (op.type === 'delete' && op.id) {
          req = store.delete(op.id);
        } else {
          pending--;
          if (pending === 0) resolve();
          continue;
        }
        req.onsuccess = req.onerror = () => {
          pending--;
          if (pending === 0) resolve();
        };
      }
    });
  }

  // ---- 事件监听实现（protected 对齐基类）----
  protected eventListeners: Map<DatabaseEvent, Function[]> = new Map();

  async addEventListener(event: DatabaseEvent, listener: Function): Promise<void> {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  async removeEventListener(event: DatabaseEvent, listener: Function): Promise<void> {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }
  }

  // ---- 事务支持（伪实现，protected 对齐基类）----
  protected transactionActive = false;

  async beginTransaction(): Promise<void> {
    this.transactionActive = true;
  }
  async commitTransaction(): Promise<void> {
    this.transactionActive = false;
  }
  async rollbackTransaction(): Promise<void> {
    this.transactionActive = false;
  }
  async isTransactionActive(): Promise<boolean> {
    return this.transactionActive;
  }

  // ---- executeRawQuery 占位实现 ----
  async executeRawQuery(query: string): Promise<any> {
    throw new Error('executeRawQuery is not supported in FakeIndexedDBClient');
  }

  // ---- BaseClient 抽象方法补全 ----
  async close(): Promise<void> {
    this.db = null;
  }
  async connect(): Promise<void> {
    await this.initialize();
  }
  async disconnect(): Promise<void> {
    this.db = null;
  }
  async findById(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }
  async getStats(): Promise<StorageStats> {
    return { totalSize: 0, availableSpace: 0, usedSpace: 0 };
  }
  async getDatabaseVersion(): Promise<number> {
    this.checkInitialized();
    return this.db!.version;
  }
  async getTableNames(): Promise<string[]> {
    this.checkInitialized();
    return Array.from(this.db!.objectStoreNames);
  }
  async clear(): Promise<void> {
    this.checkInitialized();
    const tableNames = Array.from(this.db!.objectStoreNames);
    for (const tableName of tableNames) {
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction(tableName, 'readwrite');
        const store = tx.objectStore(tableName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }
  async findAll(tableName: string): Promise<T[]> {
    this.checkInitialized();
    return new Promise<T[]>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }
  async count(tableName: string): Promise<number> {
    this.checkInitialized();
    return new Promise<number>((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }
  getType(): string { return 'fake-indexeddb'; }
  isInitialized(): boolean { return !!this.db; }
  getConfig(): DatabaseConfig { return this.config; }
  // 其它未实现方法可根据需要补充
}

// 注册到全局注册表
ClientRegistry.register('indexeddb', 'fake', FakeIndexedDBClient);
