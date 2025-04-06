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

import { IndexedDBClient, IndexedDBConfig } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { schemaRegistry } from '@/core/lib/db/schema';
import { DatabaseErrorCode } from '@/core/lib/db/errors';
import { TableSchema } from '@/core/lib/db/schema/types';

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

// 存储原始的indexedDB引用，以便在需要时恢复
let originalIndexedDB: IDBFactory | null = null;
let isFakeIndexedDBEnabled = false;

// 保存模拟IndexedDB实例
let currentIndexedDBInstance: IDBFactory = fakeIndexedDB;

/**
 * Mock IndexedDB 客户端
 * 基于 fake-indexeddb，用于测试环境
 */
export class MockIndexedDBClient extends IndexedDBClient {
  // Use global singleton to track if fake-indexeddb has been set up
  private static setupCompleted = false;
  // Use instance variable to track initialization state
  private isInitialized = false;
  private dbName: string;
  private dbVersion: number;

  constructor(config: IndexedDBConfig) {
    super(config);
    this.dbName = (this as any).config?.name || 'app-database';
    this.dbVersion = parseInt((this as any).config?.version || '1', 10);
    
    // Setup the fake IndexedDB environment only once
    if (!MockIndexedDBClient.setupCompleted) {
      try {
        setupFakeIndexedDB();
        MockIndexedDBClient.setupCompleted = true;
        console.log('FakeIndexedDB 环境已设置');
      } catch (error) {
        console.warn('设置fake-indexedDB环境警告:', error);
      }
    }
    
    // Point IndexedDBClient's _indexedDB to our fake instance
    if (typeof (this as any)._indexedDB === 'undefined') {
      (this as any)._indexedDB = fakeIndexedDB;
    }
  }

  /**
   * 打开数据库
   */
  private async openDatabase(): Promise<IDBDatabase | null> {
    try {
      const dbName = (this as any).config?.name || 'app-database';
      return await new Promise<IDBDatabase>((resolve, reject) => {
        const request = fakeIndexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('打开数据库失败:', error);
      return null;
    }
  }

  /**
   * 清除所有缓存
   */
  public clearAllCaches(): void {
    // 模拟清除缓存操作
    console.log('已清除所有缓存');
  }

  /**
   * 强制重新初始化数据库
   * 删除并重新创建数据库
   */
  async initialize(): Promise<void> {
    // Skip if already initialized
    if (this.isInitialized) {
      console.log(`此MockIndexedDBClient实例已初始化 (${this.dbName})`);
      return;
    }
    
    try {
      console.log(`⏱️ 开始初始化数据库: ${this.dbName}, 版本: ${this.dbVersion}`);
      
      // 确保没有现有数据库，先删除
      try {
        console.log(`🗑️ 尝试删除现有数据库: ${this.dbName}`);
        await this.deleteDatabase(this.dbName);
        console.log(`✅ 删除成功: ${this.dbName}`);
      } catch (e) {
        console.warn('删除数据库失败, 可能不存在:', e);
      }
      
      console.log(`📊 正在准备数据库模式...`);
      const { schemaRegistry, initializeSchemas } = require('@/core/lib/db/schema/index');
      initializeSchemas();
      
      const schemas = schemaRegistry.getAllSchemas();
      if (schemas.length === 0) {
        throw new Error('没有注册任何模式，请检查模式初始化过程');
      }
      
      console.log(`📋 创建数据库 "${this.dbName}" 包含 ${schemas.length} 个表: ${
        schemas.map((s: any) => s.name).join(', ')
      }`);
      
      // 创建并打开数据库
      (this as any).db = await this.createAndOpen(schemas);
      console.log(`🔌 数据库连接已建立: ${this.dbName}`);
      
      // 验证所有表是否存在
      const verified = await this.verifyTables();
      if (!verified) {
        throw new Error('数据库表验证失败，请检查模式注册和表创建过程');
      }
      
      this.isInitialized = true;
      console.log(`✅ MockIndexedDBClient 初始化成功 (${this.dbName})`);
      
    } catch (error) {
      console.error('❌ 初始化 MockIndexedDBClient 失败:', error);
      this.isInitialized = false;
      if ((this as any).db) {
        try {
          (this as any).db.close();
        } catch (e) {
          // Ignore close errors
        }
        (this as any).db = null;
      }
      throw error;
    }
  }
  
  /**
   * 创建并打开数据库，确保所有表都已创建
   */
  private async createAndOpen(schemas: any[]): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      console.log(`🔑 打开数据库: ${this.dbName}, 版本: ${this.dbVersion}`);
      const openRequest = fakeIndexedDB.open(this.dbName, this.dbVersion);
      
      openRequest.onupgradeneeded = (event) => {
        console.log(`🔼 数据库升级事件触发: ${this.dbName}, 新版本: ${this.dbVersion}`);
        const db = openRequest.result;
        
        // 创建所有表
        for (const schema of schemas) {
          try {
            // 检查表是否已存在
            if (!db.objectStoreNames.contains(schema.name)) {
              console.log(`➕ 创建表: ${schema.name}`);
              const store = db.createObjectStore(schema.name, { keyPath: 'id' });
              
              // 添加索引
              if (schema.indexes) {
                for (const index of schema.indexes) {
                  const indexName = index.name || index.columns.join('_');
                  const keyPath = index.columns.length === 1 ? index.columns[0] : index.columns;
                  console.log(`  📌 添加索引: ${indexName} 到表 ${schema.name}`);
                  store.createIndex(indexName, keyPath, { unique: index.unique || false });
                }
              }
            } else {
              console.log(`⚠️ 表已存在: ${schema.name}`);
            }
          } catch (error) {
            console.error(`❌ 创建表 ${schema.name} 失败:`, error);
            // 继续创建其他表
          }
        }
        console.log('✅ 所有表创建完成');
      };
      
      openRequest.onsuccess = () => {
        console.log(`✅ 数据库打开成功: ${this.dbName}`);
        resolve(openRequest.result);
      };
      
      openRequest.onerror = () => {
        console.error(`❌ 打开数据库失败: ${this.dbName}`, openRequest.error);
        reject(openRequest.error);
      };
      
      openRequest.onblocked = () => {
        console.warn(`⚠️ 数据库操作被阻塞: ${this.dbName}`);
        // 尝试关闭所有其他连接
        const closeAllRequests = fakeIndexedDB.databases();
        Promise.resolve(closeAllRequests)
          .then((databases) => {
            databases.forEach((db) => {
              if (db.name === this.dbName) {
                try {
                  // 尝试删除并重新打开
                  fakeIndexedDB.deleteDatabase(this.dbName);
                } catch (e) {
                  console.warn('无法删除被阻塞的数据库:', e);
                }
              }
            });
          })
          .catch(console.error);
      };
    });
  }

  /**
   * 删除数据库
   */
  private async deleteDatabase(dbName: string): Promise<void> {
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
   * 验证所有必要的表是否已经创建
   * @returns true if verification passed, false otherwise
   */
  private async verifyTables(): Promise<boolean> {
    if (!(this as any).db) {
      console.error('❌ 无法验证表: 数据库未初始化');
      return false;
    }
    
    const { schemaRegistry } = require('@/core/lib/db/schema');
    const expectedTables = schemaRegistry.getAllSchemas().map((schema: any) => schema.name);
    const actualTables = Array.from((this as any).db.objectStoreNames);
    
    console.log('📋 验证数据库表:');
    console.log('- 预期的表:', expectedTables.join(', '));
    console.log('- 实际的表:', actualTables.join(', '));
    
    // 检查缺失的表
    const missingTables = expectedTables.filter((name: string) => !actualTables.includes(name));
    if (missingTables.length > 0) {
      console.error(`❌ 表验证失败: 缺少以下表: ${missingTables.join(', ')}`);
      
      // 核心表检查
      const coreTables = ['users', 'matches', 'messages'];
      const missingCoreTables = missingTables.filter((name: string) => coreTables.includes(name));
      if (missingCoreTables.length > 0) {
        console.error(`❌ 致命错误: 缺少核心表: ${missingCoreTables.join(', ')}`);
        return false;
      }
    } else {
      console.log('✅ 表存在性验证通过');
    }
    
    // 检查表是否可以访问
    try {
      console.log('🔍 验证表可访问性...');
      for (const tableName of actualTables) {
        const tx = (this as any).db.transaction(tableName, 'readonly');
        const store = tx.objectStore(tableName);
        // 检查每个表是否有id键路径
        const keyPath = store.keyPath;
        if (keyPath !== 'id') {
          console.warn(`⚠️ 警告: 表 ${tableName} 的键路径不是 'id', 而是: ${keyPath}`);
        }
        console.log(`✅ 表 ${tableName} 可正常访问, 键路径: ${keyPath}`);
      }
      console.log('✅ 所有表验证成功');
      return true;
    } catch (error) {
      console.error('❌ 表访问验证失败:', error);
      return false;
    }
  }

  /**
   * 检查客户端是否已初始化
   */
  protected checkInitialized(): void {
    if (!this.isInitialized || !(this as any).db) {
      console.error(`❌ MockIndexedDBClient未初始化: ${this.dbName}`);
      throw new Error('数据库客户端未初始化');
    }
  }

  /**
   * 查找所有记录
   */
  public async findAll<T>(tableName: string, filter?: any): Promise<T[]> {
    try {
      this.checkInitialized();
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = (this as any).db.transaction(tableName, 'readonly');
          const store = transaction.objectStore(tableName);
          const request = store.getAll();
          
          request.onsuccess = () => {
            console.log(`✅ 成功从 ${tableName} 获取了 ${request.result.length} 条记录`);
            let results = request.result;
            
            // 如果有过滤条件，应用过滤器
            if (filter) {
              results = results.filter((item: any) => {
                return Object.keys(filter).every(key => item[key] === filter[key]);
              });
            }
            
            resolve(results);
          };
          
          request.onerror = () => {
            console.error(`❌ 从 ${tableName} 获取记录失败:`, request.error);
            reject(request.error);
          };
          
          transaction.onerror = () => {
            console.error(`❌ 事务失败 (查询 ${tableName}):`, transaction.error);
            reject(transaction.error);
          };
        } catch (error) {
          console.error(`❌ 执行findAll查询失败 (${tableName}):`, error);
          reject(error);
        }
      });
    } catch (error) {
      console.error(`❌ 查询所有记录失败: ${tableName}`, error);
      return [];
    }
  }

  /**
   * 检查一个表是否存在
   */
  public async tableExists(tableName: string): Promise<boolean> {
    if (!(this as any).db) {
      return false;
    }
    
    return Array.from((this as any).db.objectStoreNames).includes(tableName);
  }

  /**
   * 重置客户端并创建新的数据库
   */
  public async reset(): Promise<void> {
    this.isInitialized = false;
    
    try {
      resetFakeIndexedDB();
      
      if ((this as any).db) {
        try {
          (this as any).db.close();
        } catch (e) {
          // Ignore close errors
        }
        (this as any).db = null;
      }
    } catch (error) {
      console.warn('重置fake-indexedDB失败:', error);
    }
    
    await this.initialize();
  }

  /**
   * 清空测试数据
   */
  public async clearTestData(): Promise<void> {
    await this.clear();
  }
  
  /**
   * 获取当前IndexedDB实例
   */
  public getIndexedDBInstance(): IDBFactory {
    return currentIndexedDBInstance;
  }
  
  /**
   * 确保使用正确的IndexedDB实例
   * 覆盖父类方法，确保总是使用fake-indexedDB
   */
  protected getIndexedDB(): IDBFactory {
    return currentIndexedDBInstance;
  }
  
  /**
   * 析构函数，清理资源
   */
  public async close(): Promise<void> {
    await super.close();
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
  IndexedDBTestHelper
}; 