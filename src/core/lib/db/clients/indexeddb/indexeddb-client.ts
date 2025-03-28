import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';

/**
 * IndexedDB 数据库客户端
 * 用于浏览器环境的本地存储
 */
export class IndexedDBClient extends BaseClient implements IDatabaseClient {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private dbName: string;
  private dbVersion: number;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name || 'app-database';
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 检查环境是否支持 IndexedDB
      if (!window.indexedDB) {
        throw new Error('当前浏览器不支持 IndexedDB');
      }

      // 打开数据库连接
      const openRequest = window.indexedDB.open(this.dbName, this.dbVersion);

      // 处理数据库升级事件
      openRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };

      // 等待数据库打开
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onerror = () => reject(openRequest.error);
      });

      this.initialized = true;
      console.log(`IndexedDB 数据库 "${this.dbName}" 初始化成功`);
    } catch (error) {
      console.error('IndexedDB 初始化失败:', error);
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
    
    const schemas = schemaRegistry.getAllSchemas();
    
    for (const schema of schemas) {
      await this.clearStore(schema.name);
    }
  }

  // 通用数据访问方法
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      return await this.executeTransaction(tableName, 'readonly', (store) => {
        return new Promise<T | null>((resolve, reject) => {
          const request = store.get(id);
          
          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? this.processResult<T>(result) : null);
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      });
    } catch (error) {
      console.error(`查询失败 (${tableName}/${id}):`, error);
      return null;
    }
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    try {
      return await this.executeTransaction(tableName, 'readonly', (store) => {
        return new Promise<T[]>((resolve, reject) => {
          const request = store.getAll();
          
          request.onsuccess = () => {
            let results = request.result.map((item: Record<string, any>) => 
              this.processResult<T>(item)
            );
            
            // 应用过滤条件
            if (filter && Object.keys(filter).length > 0) {
              results = results.filter((item: any) => {
                return Object.entries(filter).every(([key, value]) => {
                  return item[key] === value;
                });
              });
            }
            
            resolve(results);
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      });
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async create<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳
    const itemWithTimestamps = this.addTimestamps(data, false);
    
    try {
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.add(itemWithTimestamps);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      
      return itemWithTimestamps;
    } catch (error) {
      console.error(`创建失败 (${tableName}):`, error);
      throw error;
    }
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      // 先获取现有数据
      const existing = await this.findById<T>(tableName, id);
      if (!existing) {
        throw new Error(`更新失败: 找不到 ID 为 ${id} 的记录`);
      }
      
      // 合并数据并添加更新时间戳
      const updatedData = this.addTimestamps({ ...existing, ...data }, true);
      
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(updatedData);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error(`更新失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error(`删除失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    this.checkInitialized();
    
    try {
      // 获取所有数据
      let results = await this.findAll<T>(tableName);
      
      // 应用过滤条件
      if (options.where && Object.keys(options.where).length > 0) {
        results = this.applyFilter(results, options.where);
      }
      
      // 应用排序
      if (options.orderBy) {
        results = this.applySort(results, options.orderBy);
      }
      
      // 应用分页
      if (options.offset !== undefined || options.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit !== undefined ? offset + options.limit : undefined;
        results = results.slice(offset, limit);
      }
      
      // 应用字段选择
      if (options.select && options.select.length > 0) {
        results = results.map((item: any) => {
          const selected: Record<string, any> = {};
          options.select!.forEach(field => {
            if (field in item) {
              selected[field] = item[field];
            }
          });
          return selected as T;
        });
      }
      
      return results;
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    throw new Error('IndexedDB 不支持原始 SQL 查询');
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    
    try {
      // 创建事务代理
      const trxProxy = { ...this };
      
      // 执行回调
      return await callback(trxProxy);
    } catch (error) {
      console.error('事务执行失败:', error);
      throw error;
    }
  }

  // 实现 IDatabaseClient 接口的通用实体方法
  async saveEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    if (entity.id) {
      await this.update(tableName, entity.id, entity);
      return entity;
    } else {
      return await this.create(tableName, entity);
    }
  }

  async getEntity<T>(tableName: string, id: string): Promise<T | null> {
    return this.findById<T>(tableName, id);
  }

  async getAllEntities<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    return this.findAll<T>(tableName, filter);
  }

  async updateEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    await this.update(tableName, entity.id, entity);
    return entity;
  }

  async deleteEntity(tableName: string, id: string): Promise<boolean> {
    await this.delete(tableName, id);
    return true;
  }

  async getEntitiesByRelation<T>(
    tableName: string, 
    relationField: string, 
    relationId: string
  ): Promise<T[]> {
    return this.findAll<T>(tableName, { [relationField]: relationId });
  }

  // 辅助方法
  private createStores(db: IDBDatabase): void {
    const schemas = schemaRegistry.getAllSchemas();
    
    for (const schema of schemas) {
      if (!db.objectStoreNames.contains(schema.name)) {
        db.createObjectStore(schema.name, { keyPath: 'id' });
        console.log(`创建存储 "${schema.name}"`);
      }
    }
  }

  private async clearStore(storeName: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  private async executeTransaction<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    
    const transaction = this.db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    try {
      return await callback(store);
    } catch (error) {
      transaction.abort();
      throw error;
    }
  }

  private applyFilter<T>(items: T[], filter: Record<string, any>): T[] {
    return items.filter((item: any) => {
      // 处理特殊操作符
      if (filter.$or && Array.isArray(filter.$or)) {
        return filter.$or.some(subFilter => 
          this.matchesFilter(item, subFilter)
        );
      }
      
      return this.matchesFilter(item, filter);
    });
  }

  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (key === '$or') return true; // 已在外层处理
      
      if (key === '$ne' && typeof value === 'object') {
        // 不等于操作符
        return Object.entries(value).every(([neKey, neValue]) => 
          item[neKey] !== neValue
        );
      } else if (key === '$contains' && typeof value === 'string') {
        // 包含操作符
        return typeof item[key] === 'string' && 
               item[key].toLowerCase().includes(value.toLowerCase());
      } else {
        // 普通相等条件
        return item[key] === value;
      }
    });
  }

  private applySort<T>(items: T[], orderBy: string | string[]): T[] {
    const orderFields = Array.isArray(orderBy) ? orderBy : [orderBy];
    
    return [...items].sort((a: any, b: any) => {
      for (const field of orderFields) {
        const desc = field.startsWith('-');
        const fieldName = desc ? field.substring(1) : field;
        
        if (a[fieldName] < b[fieldName]) {
          return desc ? 1 : -1;
        }
        
        if (a[fieldName] > b[fieldName]) {
          return desc ? -1 : 1;
        }
      }
      
      return 0;
    });
  }

  /**
   * 处理数据库结果，转换特殊类型
   */
  private processResult<T>(result: Record<string, any>): T {
    const processed: Record<string, any> = { ...result };
    
    // 处理日期字段
    for (const key in processed) {
      // 如果是日期字符串，转换为 Date 对象
      if (typeof processed[key] === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(processed[key])) {
        processed[key] = new Date(processed[key]);
      }
    }
    
    return processed as T;
  }
}