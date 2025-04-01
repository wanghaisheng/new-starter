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

// 导出所有 fake-indexeddb 对象
export {
  fakeIndexedDB,
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
};

/**
 * 设置全局环境变量，替换真实的 IndexedDB API
 * 用于测试时自动设置环境
 */
export function setupFakeIndexedDB(): void {
  // 在全局环境设置 fake-indexeddb
  const global = (typeof window !== 'undefined' ? window : globalThis) as any;
  
  global.indexedDB = fakeIndexedDB;
  global.IDBFactory = IDBFactory;
  global.IDBDatabase = IDBDatabase;
  global.IDBObjectStore = IDBObjectStore;
  global.IDBIndex = IDBIndex;
  global.IDBTransaction = IDBTransaction;
  global.IDBRequest = IDBRequest;
  global.IDBOpenDBRequest = IDBOpenDBRequest;
  global.IDBCursor = IDBCursor;
  global.IDBCursorWithValue = IDBCursorWithValue;
  global.IDBKeyRange = IDBKeyRange;
  global.IDBVersionChangeEvent = IDBVersionChangeEvent;
}

/**
 * 重置 IndexedDB 状态
 * 清除所有数据库和连接
 */
export function resetFakeIndexedDB(): void {
  const global = (typeof window !== 'undefined' ? window : globalThis) as any;
  
  // 创建一个新的 IDBFactory 实例来重置状态
  const newFactory = new IDBFactory();
  global.indexedDB = newFactory;
  
  // 如果当前已经使用了 fakeIndexedDB，也更新它
  if (global.indexedDB === fakeIndexedDB) {
    Object.assign(fakeIndexedDB, newFactory);
  }
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
  createTestDatabase,
  deleteTestDatabase,
  IndexedDBTestHelper
}; 