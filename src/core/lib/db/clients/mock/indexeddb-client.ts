import { BaseClient } from '../base-client';
import { IDBPDatabase, openDB, IDBPTransaction } from 'idb';
import indexedDB from 'fake-indexeddb';
import { IBaseDatabaseClient } from '../../interfaces';
import { schemaRegistry } from '../../schema';

// 注册 fake-indexeddb
if (typeof window === 'undefined') {
  (global as any).indexedDB = indexedDB;
}

/**
 * Mock IndexedDB 客户端实现
 * 用于开发环境中的数据库模拟
 */
export class MockIndexedDBClient extends BaseClient implements IBaseDatabaseClient {
  private db: IDBPDatabase | null = null;
  private dbName: string;
  private version: number;
  private currentTransaction: IDBPTransaction | null = null;

  constructor(dbName: string = 'mock_db', version: number = 1) {
    super();
    this.dbName = dbName;
    this.version = version;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // 从 schemaRegistry 获取所有表定义
          const schemas = schemaRegistry.getAllSchemas();
          
          // 为每个表创建对象存储和索引
          schemas.forEach(schema => {
            if (!db.objectStoreNames.contains(schema.name)) {
              const store = db.createObjectStore(schema.name, { keyPath: 'id' });
              
              // 创建索引
              schema.indexes?.forEach(index => {
                if (index.columns.length === 1) {
                  store.createIndex(index.name, index.columns[0], { unique: index.unique });
                } else {
                  // 复合索引
                  store.createIndex(index.name, index.columns, { unique: index.unique });
                }
              });
            }
          });
        }
      });

      this.initialized = true;
      console.log('Mock IndexedDB 客户端初始化成功');
    } catch (error) {
      console.error('Mock IndexedDB 客户端初始化失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    if (!this.db) return;

    const schemas = schemaRegistry.getAllSchemas();
    const storeNames = schemas.map(schema => schema.name);
    
    const tx = this.db.transaction(storeNames, 'readwrite');
    
    await Promise.all(
      storeNames.map(name => tx.objectStore(name).clear())
    );

    await tx.done;
  }

  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    if (!this.db) return null;

    return await this.db.get(tableName, id);
  }

  async findAll<T>(tableName: string): Promise<T[]> {
    this.checkInitialized();
    if (!this.db) return [];

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    return await store.getAll();
  }

  async create<T>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    if (!this.db) throw new Error('数据库未初始化');

    const schema = schemaRegistry.getSchema(tableName);
    if (!schema) throw new Error(`表 ${tableName} 未定义`);

    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    
    const newData = this.addTimestamps({
      ...data,
      id: (data as any).id || this.generateId()
    });

    // 验证必填字段
    schema.columns.forEach(column => {
      if (column.notNull && !(column.name in newData)) {
        throw new Error(`字段 ${column.name} 为必填项`);
      }
    });

    await store.add(newData);
    await tx.done;

    return newData;
  }

  async update<T>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw new Error('数据库未初始化');

    const schema = schemaRegistry.getSchema(tableName);
    if (!schema) throw new Error(`表 ${tableName} 未定义`);

    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    
    const existing = await store.get(id);
    if (!existing) throw new Error(`记录未找到: ${id}`);

    const updatedData = this.addTimestamps(
      { ...existing, ...data },
      true
    );

    // 验证必填字段
    schema.columns.forEach(column => {
      if (column.notNull && !(column.name in updatedData)) {
        throw new Error(`字段 ${column.name} 为必填项`);
      }
    });

    await store.put(updatedData);
    await tx.done;
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw new Error('数据库未初始化');

    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    
    await store.delete(id);
    await tx.done;
  }

  async query<T>(tableName: string, query: any): Promise<T[]> {
    this.checkInitialized();
    if (!this.db) return [];

    const schema = schemaRegistry.getSchema(tableName);
    if (!schema) throw new Error(`表 ${tableName} 未定义`);

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    let items = await store.getAll();

    // 应用过滤条件
    if (query.where) {
      items = items.filter(item => {
        return Object.entries(query.where).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    // 应用排序
    if (query.orderBy) {
      const orderByFields = Array.isArray(query.orderBy) ? query.orderBy : [query.orderBy];
      items.sort((a, b) => {
        for (const field of orderByFields) {
          const aValue = a[field];
          const bValue = b[field];
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
        }
        return 0;
      });
    }

    // 应用分页
    if (query.offset !== undefined) {
      items = items.slice(query.offset);
    }
    if (query.limit !== undefined) {
      items = items.slice(0, query.limit);
    }

    // 应用字段选择
    if (query.select) {
      items = items.map(item => {
        const selected: any = {};
        query.select.forEach((field: string) => {
          if (schema.columns.some(col => col.name === field)) {
            selected[field] = item[field];
          }
        });
        return selected;
      });
    }

    await tx.done;
    return items;
  }

  async count(tableName: string, query?: any): Promise<number> {
    this.checkInitialized();
    if (!this.db) return 0;

    const schema = schemaRegistry.getSchema(tableName);
    if (!schema) throw new Error(`表 ${tableName} 未定义`);

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    let items = await store.getAll();

    // 应用过滤条件
    if (query?.where) {
      items = items.filter(item => {
        return Object.entries(query.where).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    await tx.done;
    return items.length;
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) throw new Error('数据库未初始化');

    const schemas = schemaRegistry.getAllSchemas();
    const storeNames = schemas.map(schema => schema.name);
    
    this.currentTransaction = this.db.transaction(storeNames, 'readwrite');
  }

  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }

    await this.currentTransaction.done;
    this.currentTransaction = null;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }

    this.currentTransaction.abort();
    this.currentTransaction = null;
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    if (!this.db) throw new Error('数据库未初始化');

    const schemas = schemaRegistry.getAllSchemas();
    const storeNames = schemas.map(schema => schema.name);
    
    const tx = this.db.transaction(storeNames, 'readwrite');
    
    try {
      const result = await callback(tx);
      await tx.done;
      return result;
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    // Mock 环境中不支持原始 SQL 查询
    throw new Error('Mock IndexedDB 不支持原始 SQL 查询');
  }
} 