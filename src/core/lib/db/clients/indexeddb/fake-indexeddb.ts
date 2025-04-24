/**
 * Fake IndexedDB 实现
 * 用于在测试环境中模拟 IndexedDB API
 * 
 * 基于 https://github.com/dumbmatter/fakeIndexedDB
 */

// 导入 fake-indexeddb 包中的所有核心对象
import {
  indexedDB as fakeIndexedDB,
  IDBFactory,
  IDBDatabase,
  IDBObjectStore,
  IDBIndex,
  IDBTransaction,
  IDBRequest,
  IDBOpenDBRequest,
  IDBCursor,
  IDBCursorWithValue,
  IDBKeyRange,
  IDBVersionChangeEvent
} from 'fake-indexeddb';

import { BaseClient } from '@/core/lib/db/clients/base-client';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { schemaRegistry } from '@/core/lib/db/schema';
import type { TableSchema } from '@/core/lib/db/schema/types';
import type { StorageStats } from '@/core/lib/db/types/database';

// 错误类型和日志类型统一从 types 下导入
import type { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database-error';

// 导出所有 fake-indexeddb 对象
export type {
  IDBFactory,
  IDBDatabase,
  IDBObjectStore,
  IDBIndex,
  IDBTransaction,
  IDBRequest,
  IDBOpenDBRequest,
  IDBCursor, 
  IDBCursorWithValue,
  IDBKeyRange,
  IDBVersionChangeEvent,
  StorageStats
};

// 存储原始的indexedDB引用，以便在需要时恢复
let originalIndexedDB: IDBFactory | null = null;
let isFakeIndexedDBEnabled = false;

// 保存模拟IndexedDB实例
let currentIndexedDBInstance: IDBFactory = fakeIndexedDB;

/**
 * Mock IndexedDB 客户端
 * 基于 fake-indexeddb，用于测试环境
 */
export class MockIndexedDBClient<T extends BaseEntity> extends BaseClient {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private config: { name: string; version?: number };

  constructor(config: { name: string; version?: number }) {
    super();
    this.config = config;
    this.dbName = config.name;
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.db = await new Promise((resolve, reject) => {
      const request = fakeIndexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const schema of schemaRegistry.getAllSchemas()) {
          if (!db.objectStoreNames.contains(schema.name)) {
            const store = db.createObjectStore(schema.name, { keyPath: 'id' });
            if (Array.isArray(schema.indexes)) {
              for (const index of schema.indexes) {
                store.createIndex(index.name, index.columns, { unique: index.unique });
              }
            }
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    this.initialized = true;
    this.logger.info('MockIndexedDBClient 初始化完成');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    if (!this.db) return;
    const storeNames = Array.from(this.db.objectStoreNames);
    for (const name of storeNames) {
      const tx = this.db.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
    }
  }

  async connect(): Promise<void> { await this.initialize(); }
  async disconnect(): Promise<void> { await this.close(); }

  async findById(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readonly');
      const store = tx.objectStore(tableName);
      const req = store.getAll();
      req.onsuccess = () => {
        let results = req.result as T[];
        if (filter) {
          results = results.filter(item => this.matchesFilter(item, filter as Partial<T>));
        }
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async create(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const req = store.add(data);
      req.onsuccess = () => resolve(data);
      req.onerror = () => reject(req.error);
    });
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const entity = getReq.result;
        if (!entity) return reject(new Error('Entity not found'));
        const updated = { ...entity, ...data };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
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
            const aValue = a[field];
            const bValue = b[field];
            if (aValue === bValue) return 0;
            const comparison = aValue < bValue ? -1 : 1;
            return direction === 'asc' ? comparison : -comparison;
          });
        }
        const total = results.length;
        let processedResults = results;
        if (options.limit !== undefined || options.offset !== undefined) {
          const start = options.offset || 0;
          const end = options.limit !== undefined ? start + options.limit : undefined;
          processedResults = processedResults.slice(start, end);
        }
        resolve({ items: processedResults, total, hasMore: total > (processedResults.length + (options.offset || 0)) });
      };
      req.onerror = () => reject(req.error);
    });
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    const all = await this.findAll(tableName, filter);
    return all.length;
  }

  async batch(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      try {
        for (const op of operations) {
          // BatchOperation type: type: 'add' | 'put' | 'update' | 'delete'
          if (op.type === 'add' || op.type === 'put' || op.type === 'update') {
            store.put(op.data);
          } else if (op.type === 'delete') {
            if (op.id !== undefined) {
              store.delete(op.id);
            }
          }
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.logger.warn('executeRawQuery is not supported in MockIndexedDBClient');
    return [];
  }

  // 事务相关方法：mock 环境下为 no-op 实现
  async beginTransaction(): Promise<void> {
    this.logger.info('MockIndexedDBClient: beginTransaction (no-op)');
  }
  async commitTransaction(): Promise<void> {
    this.logger.info('MockIndexedDBClient: commitTransaction (no-op)');
  }
  async rollbackTransaction(): Promise<void> {
    this.logger.info('MockIndexedDBClient: rollbackTransaction (no-op)');
  }

  // 简单过滤器实现（可复用正式实现）
  private matchesFilter(item: any, filter: Partial<T>): boolean {
    if (!item || typeof item !== 'object') return false;
    if (!filter) return true;
    return Object.entries(filter).every(([key, value]) => {
      if (key === '$or' && Array.isArray(value)) {
        return value.some((subFilter: Partial<T>) => this.matchesFilter(item, subFilter));
      }
      if (key === '$and' && Array.isArray(value)) {
        return value.every((subFilter: Partial<T>) => this.matchesFilter(item, subFilter));
      }
      if (typeof value === 'object' && value !== null) {
        if ('$contains' in value) {
          return Array.isArray(item[key]) && item[key].includes(value.$contains);
        }
        if ('$in' in value && Array.isArray(value.$in)) {
          return value.$in.includes(item[key]);
        }
        if ('$gt' in value) {
          return item[key] > value.$gt;
        }
        if ('$gte' in value) {
          return item[key] >= value.$gte;
        }
        if ('$lt' in value) {
          return item[key] < value.$lt;
        }
        if ('$lte' in value) {
          return item[key] <= value.$lte;
        }
        if ('$ne' in value) {
          return item[key] !== value.$ne;
        }
      }
      return item[key] === value;
    });
  }
}

/**
 * 设置全局环境变量，替换真实的 IndexedDB API
 * 用于测试时自动设置环境
 */
export function setupFakeIndexedDB(): void {
  if (isFakeIndexedDBEnabled) {
    return;
  }
  
  const isInBrowser = typeof window !== 'undefined';
  currentIndexedDBInstance = fakeIndexedDB;
  
  if (!isInBrowser) {
    (globalThis as any).indexedDB = currentIndexedDBInstance;
    (globalThis as any).IDBFactory = IDBFactory;
    (globalThis as any).IDBDatabase = IDBDatabase;
    (globalThis as any).IDBObjectStore = IDBObjectStore;
    (globalThis as any).IDBIndex = IDBIndex;
    (globalThis as any).IDBTransaction = IDBTransaction;
    (globalThis as any).IDBRequest = IDBRequest;
    (globalThis as any).IDBOpenDBRequest = IDBOpenDBRequest;
    (globalThis as any).IDBCursor = IDBCursor;
    (globalThis as any).IDBCursorWithValue = IDBCursorWithValue;
    (globalThis as any).IDBKeyRange = IDBKeyRange;
    (globalThis as any).IDBVersionChangeEvent = IDBVersionChangeEvent;
    isFakeIndexedDBEnabled = true;
    return;
  }
  
  try {
    originalIndexedDB = window.indexedDB;
    
    console.log('浏览器环境中使用内部fakeIndexedDB，不修改全局window.indexedDB');
    
    isFakeIndexedDBEnabled = true;
  } catch (error) {
    console.warn('注意: 在浏览器环境中使用内部fakeIndexedDB:', error);
  }
}

/**
 * 重置 IndexedDB 状态
 * 清除所有数据库和连接
 */
export function resetFakeIndexedDB(): void {
  const newFactory = new IDBFactory();
  
  Object.assign(currentIndexedDBInstance, newFactory);
  
  if (typeof window === 'undefined') {
    (globalThis as any).indexedDB = newFactory;
  }
}

/**
 * 恢复原始的IndexedDB实现（如果有的话）
 */
export function restoreOriginalIndexedDB(): void {
  if (!isFakeIndexedDBEnabled || typeof window === 'undefined') {
    return;
  }
  
  if (originalIndexedDB && typeof window !== 'undefined') {
    currentIndexedDBInstance = originalIndexedDB;
    isFakeIndexedDBEnabled = false;
    console.log('已恢复原始indexedDB引用');
  }
}

/**
 * 获取存储统计信息
 */
export async function getStorageStats(dbName: string): Promise<StorageStats> {
  // fake-indexeddb 仅模拟，直接返回 0 即可
  return {
    totalSize: 0,
    availableSpace: 0,
    usedSpace: 0
  };
}

/**
 * 创建一个内存中的测试数据库
 * @param dbName 数据库名称
 * @param version 数据库版本
 * @param setupCallback 数据库初始化回调，用于创建对象存储和索引
 * @returns Promise<IDBDatabase> 数据库实例
 */
export async function createTestDatabase(
  dbName: string,
  version: number = 1,
  setupCallback?: (db: IDBDatabase) => void
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = fakeIndexedDB.open(dbName, version);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (setupCallback) {
        setupCallback(db);
      }
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 删除测试数据库
 * @param dbName 数据库名称
 * @returns Promise<void>
 */
export async function deleteTestDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = fakeIndexedDB.deleteDatabase(dbName);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 测试帮助类
 * 提供便捷的测试方法
 */
export class IndexedDBTestHelper {
  private dbName: string;
  private db: IDBDatabase | null = null;
  
  constructor(dbName: string) {
    this.dbName = dbName;
  }
  
  /**
   * 打开测试数据库
   * @param version 数据库版本
   * @param setupCallback 数据库初始化回调
   */
  async openDatabase(
    version: number = 1,
    setupCallback?: (db: IDBDatabase) => void
  ): Promise<IDBDatabase> {
    if (this.db) {
      this.db.close();
    }
    
    this.db = await createTestDatabase(this.dbName, version, setupCallback);
    return this.db;
  }
  
  /**
   * 关闭数据库连接
   */
  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  
  /**
   * 删除测试数据库
   */
  async deleteDatabase(): Promise<void> {
    this.closeDatabase();
    await deleteTestDatabase(this.dbName);
  }
  
  /**
   * 添加测试数据
   * @param storeName 对象存储名称
   * @param data 要添加的数据
   */
  async addTestData<T>(storeName: string, data: T[]): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未打开');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      for (const item of data) {
        store.add(item);
      }
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
  
  /**
   * 获取所有数据
   * @param storeName 对象存储名称
   * @returns 所有数据数组
   */
  async getAllData<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      throw new Error('数据库未打开');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  /**
   * 清空存储
   * @param storeName 对象存储名称
   */
  async clearStore(storeName: string): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未打开');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default {
  fakeIndexedDB,
  setupFakeIndexedDB,
  resetFakeIndexedDB,
  restoreOriginalIndexedDB,
  createTestDatabase,
  deleteTestDatabase,
  IndexedDBTestHelper,
  getStorageStats
}; 