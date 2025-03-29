import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig, IDatabaseTransaction } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';
import { QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { BaseEntity } from '../../types/base-entity';
import { User, Match, Message } from '../../types';

/**
 * IndexedDB 数据库客户端
 * 用于浏览器环境的本地存储
 */
export class IndexedDBClient extends BaseClient implements IDatabaseClient {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private dbName: string;
  private dbVersion: number;
  private currentTransaction: IDBTransaction | null = null;

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
  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
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

  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
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

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
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

  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
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

  async query<T extends BaseEntity>(
    tableName: string,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      const store = this.db.transaction(tableName, 'readonly').objectStore(tableName);
      let results = await new Promise<T[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // 应用过滤条件
      if (options.where) {
        results = results.filter(item => {
          const itemValue = (item as any)[options.where!.field];
          switch (options.where!.operator) {
            case '==': return itemValue === options.where!.value;
            case '<': return itemValue < options.where!.value;
            case '<=': return itemValue <= options.where!.value;
            case '>': return itemValue > options.where!.value;
            case '>=': return itemValue >= options.where!.value;
            case '!=': return itemValue !== options.where!.value;
            default: return true;
          }
        });
      }

      // 应用排序
      if (options.orderBy) {
        results.sort((a, b) => {
          const aValue = (a as any)[options.orderBy!.field];
          const bValue = (b as any)[options.orderBy!.field];
          const direction = options.orderBy!.direction === 'asc' ? 1 : -1;
          return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
        });
      }

      const total = results.length;

      // 应用分页
      if (options.limit !== undefined || options.offset !== undefined) {
        const start = options.offset || 0;
        const end = options.limit !== undefined ? start + options.limit : undefined;
        results = results.slice(start, end);
      }

      return {
        data: results,
        total,
        hasMore: options.limit ? total > (options.offset || 0) + options.limit : false
      };
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      throw error;
    }
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    throw new Error('IndexedDB 不支持原始 SQL 查询');
  }

  // 事务支持
  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    if (this.currentTransaction) {
      throw new Error('已有活动的事务');
    }
    this.currentTransaction = this.db.transaction(Array.from(this.db.objectStoreNames), 'readwrite');
  }

  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    return new Promise((resolve, reject) => {
      this.currentTransaction!.oncomplete = () => {
        this.currentTransaction = null;
        resolve();
      };
      this.currentTransaction!.onerror = () => {
        this.currentTransaction = null;
        reject(this.currentTransaction!.error);
      };
    });
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    this.currentTransaction.abort();
    this.currentTransaction = null;
  }

  async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transactionWrapper: IDatabaseTransaction = {
      findById: async <T extends BaseEntity>(tableName: string, id: string) => this.findById<T>(tableName, id),
      findAll: async <T extends BaseEntity>(tableName: string, filter?: Record<string, any>) => this.findAll<T>(tableName, filter),
      create: async <T extends BaseEntity>(tableName: string, data: T) => this.create(tableName, data),
      update: async <T extends BaseEntity>(tableName: string, id: string, data: Partial<T>) => this.update(tableName, id, data),
      delete: async (tableName: string, id: string) => this.delete(tableName, id),
      query: async <T extends BaseEntity>(tableName: string, options: QueryOptions) => this.query<T>(tableName, options),
      batch: async <T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]) => this.batch(tableName, operations),
      executeRawQuery: async <T>(query: string, params?: any[]) => this.executeRawQuery<T>(query, params),
      count: async (tableName: string, filter?: Record<string, any>) => this.count(tableName, filter)
    };

    await this.beginTransaction();
    try {
      const result = await callback(transactionWrapper);
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    await this.beginTransaction();
    try {
      const store = this.currentTransaction!.objectStore(tableName);
      
      for (const operation of operations) {
        switch (operation.type) {
          case 'add':
            await new Promise((resolve, reject) => {
              const request = store.add(operation.data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            break;
          
          case 'put':
            await new Promise((resolve, reject) => {
              const request = store.put(operation.data);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            break;
          
          case 'delete':
            await new Promise((resolve, reject) => {
              const request = store.delete(operation.data.id);
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            break;
        }
      }
      await this.commitTransaction();
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  // 计数方法
  async count(tableName: string, options?: QueryOptions): Promise<number> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    try {
      const result = await this.query(tableName, options || {});
      return result.total;
    } catch (error) {
      console.error(`计数失败 (${tableName}):`, error);
      throw error;
    }
  }

  // IDatabaseClient 接口实现
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
    return this.create<User>('users', data as User);
  }

  async createMatch(data: Omit<Match, 'id'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }

  async createMessage(data: Omit<Message, 'id'>): Promise<Message> {
    return this.create<Message>('messages', data as Message);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.update<User>('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    await this.update<Match>('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    await this.update<Message>('messages', id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.delete('users', id);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.delete('matches', id);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.delete('messages', id);
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