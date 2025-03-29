import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';
import { IDBPDatabase, openDB, IDBPTransaction } from 'idb';
import { User, Match, Message } from '../../types';
import { IndexDefinition } from '../../schema/types';
import { BaseEntity } from '../../types/base-entity';
import { QueryOptions } from '../../types/database.types';

/**
 * 优化版 IndexedDB 数据库客户端
 * 包含性能优化：
 * 1. 使用 idb 库提供的类型安全和Promise包装
 * 2. 实现内存缓存
 * 3. 支持批量操作
 * 4. 支持索引查询
 */
export class OptimizedIndexedDBClient extends BaseClient implements IDatabaseClient {
  private db: IDBPDatabase | null = null;
  private config: DatabaseConfig;
  private cache: Map<string, Map<string, any>> = new Map();
  private batchOperations: Map<string, Array<{ type: 'add' | 'put' | 'delete', data: any }>> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5分钟缓存过期
  private queryCache: Map<string, { data: any[], timestamp: number }> = new Map();

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await openDB(this.config.name || 'app-database', this.config.version || 1, {
        upgrade: (db) => {
          const schemas = schemaRegistry.getAllSchemas();
          for (const schema of schemas) {
            if (!db.objectStoreNames.contains(schema.name)) {
              const store = db.createObjectStore(schema.name, { keyPath: 'id' });
              if (schema.indexes) {
                for (const index of schema.indexes) {
                  store.createIndex(index.name, index.columns, { unique: index.unique });
                }
              }
            }
          }
        },
      });

      this.initialized = true;
      console.log(`优化版 IndexedDB 数据库 "${this.config.name}" 初始化成功`);
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
      this.cache.clear();
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    const schemas = schemaRegistry.getAllSchemas();
    for (const schema of schemas) {
      const store = this.db!.transaction(schema.name, 'readwrite').objectStore(schema.name);
      await store.clear();
    }
    this.cache.clear();
  }

  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    // 检查缓存
    const cache = this.getTableCache(tableName);
    const cached = cache.get(id);
    if (cached) {
      return this.processResult<T>(cached);
    }

    const result = await this.db!.get(tableName, id);
    if (result) {
      const processed = this.processResult<T>(result);
      cache.set(id, processed);
    }
    return result ? this.processResult<T>(result) : null;
  }

  async findAll<T>(tableName: string): Promise<T[]> {
    this.checkInitialized();
    
    // 检查缓存
    const cache = this.getTableCache(tableName);
    if (cache.size > 0) {
      return Array.from(cache.values()).map(item => this.processResult<T>(item));
    }

    const results = await this.db!.getAll(tableName);
    const processed = results.map(item => this.processResult<T>(item));
    
    // 更新缓存
    results.forEach(item => {
      cache.set(item.id, item);
    });
    
    return processed;
  }

  async create<T>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    await this.db!.add(tableName, record);
    
    // 更新缓存
    const cache = this.getTableCache(tableName);
    cache.set(record.id, record);
    
    return this.processResult<T>(record);
  }

  async update<T>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    const existing = await this.db!.get(tableName, id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${tableName}`);
    }
    
    const record = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await this.db!.put(tableName, record);
    
    // 更新缓存
    const cache = this.getTableCache(tableName);
    cache.set(id, record);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    await this.db!.delete(tableName, id);
    
    // 更新缓存
    const cache = this.getTableCache(tableName);
    cache.delete(id);
  }

  async query<T>(tableName: string, options: QueryOptions): Promise<T[]> {
    this.checkInitialized();
    
    // 检查缓存
    const cacheKey = this.generateCacheKey(tableName, options);
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T[];
    }

    // 使用索引优化查询
    const schema = schemaRegistry.getSchema(tableName);
    if (schema?.indexes && options.where) {
      const indexMatch = this.findMatchingIndex(schema.indexes, options.where);
      if (indexMatch) {
        const results = await this.queryUsingIndex<T>(tableName, indexMatch, options.where);
        const processed = this.processQueryResults(results, options);
        this.updateQueryCache(cacheKey, processed);
        return processed;
      }
    }

    // 回退到全表扫描
    const results = await this.findAll<T>(tableName);
    const filtered = this.processQueryResults(results, options);
    this.updateQueryCache(cacheKey, filtered);
    return filtered;
  }

  async count(tableName: string, query?: any): Promise<number> {
    this.checkInitialized();
    const results = await this.findAll(tableName);
    return query ? results.filter(item => this.matchesFilter(item, query)).length : results.length;
  }

  // 实现特定实体方法
  async findUsers(query?: any): Promise<User[]> {
    return this.query<User>('users', query);
  }

  async findMatches(query?: any): Promise<Match[]> {
    return this.query<Match>('matches', query);
  }

  async findMessages(query?: any): Promise<Message[]> {
    return this.query<Message>('messages', query);
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const id = this.generateId();
    return this.create('users', { ...data, id } as User);
  }

  async createMatch(data: Omit<Match, 'id'>): Promise<Match> {
    const id = this.generateId();
    return this.create('matches', { ...data, id } as Match);
  }

  async createMessage(data: Omit<Message, 'id'>): Promise<Message> {
    const id = this.generateId();
    return this.create('messages', { ...data, id } as Message);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update('messages', id, data);
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

  // 事务相关方法
  async beginTransaction(): Promise<void> {
    console.warn('IndexedDB 使用自动事务管理，不需要手动开始事务');
  }

  async commitTransaction(): Promise<void> {
    console.warn('IndexedDB 使用自动事务管理，不需要手动提交事务');
  }

  async rollbackTransaction(): Promise<void> {
    console.warn('IndexedDB 使用自动事务管理，不需要手动回滚事务');
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    throw new Error('Raw queries are not supported in IndexedDB');
  }

  async transaction<T>(callback: (trx: IDBPTransaction<unknown, string[], "readwrite">) => Promise<T>): Promise<T> {
    this.checkInitialized();
    const tx = this.db!.transaction(this.db!.objectStoreNames, 'readwrite');
    try {
      const result = await callback(tx);
      await tx.done;
      return result;
    } catch (error) {
      await tx.abort();
      throw error;
    }
  }

  // 批量操作支持
  async batch<T extends BaseEntity>(tableName: string, operations: Array<{ type: 'add' | 'put' | 'delete', data: T }>): Promise<void> {
    this.checkInitialized();
    const tx = this.db!.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);

    for (const op of operations) {
      switch (op.type) {
        case 'add':
          await store.add(op.data);
          break;
        case 'put':
          await store.put(op.data);
          break;
        case 'delete':
          await store.delete(op.data.id);
          break;
      }
    }

    await tx.done;
    this.invalidateCache(tableName);
  }

  // 私有辅助方法
  private processResult<T>(record: any): T {
    if (!record) return record;
    return {
      ...record,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
    } as T;
  }

  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    if (!filter) return true;
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('$contains' in value) {
          return Array.isArray(item[key]) && item[key].includes(value.$contains);
        }
      }
      return item[key] === value;
    });
  }

  private getTableCache(tableName: string): Map<string, any> {
    if (!this.cache.has(tableName)) {
      this.cache.set(tableName, new Map());
    }
    return this.cache.get(tableName)!;
  }

  private invalidateCache(tableName: string): void {
    this.cache.delete(tableName);
    // 清除相关的查询缓存
    const keysToDelete = Array.from(this.queryCache.keys())
      .filter(key => key.startsWith(tableName));
    keysToDelete.forEach(key => this.queryCache.delete(key));
  }

  private generateCacheKey(tableName: string, options: QueryOptions): string {
    return `${tableName}:${JSON.stringify(options)}`;
  }

  private updateQueryCache(key: string, data: any[]): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private findMatchingIndex(indexes: IndexDefinition[], query: any): IndexDefinition | null {
    return indexes.find(index => 
      index.columns.every(col => query[col] !== undefined)
    ) || null;
  }

  private async queryUsingIndex<T>(
    tableName: string,
    index: IndexDefinition,
    query: Record<string, any>
  ): Promise<T[]> {
    const tx = this.db!.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const indexStore = store.index(index.name);
    
    // 构建索引键
    const key = index.columns.map(col => query[col]);
    
    // 使用索引进行查询
    const results = await indexStore.getAll(key);
    return results.map(item => this.processResult<T>(item));
  }

  private processQueryResults<T>(results: T[], options: QueryOptions): T[] {
    let processed = results;

    // 应用过滤条件
    if (options.where) {
      processed = processed.filter(item => this.matchesFilter(item, options.where!));
    }

    // 应用排序
    if (options.orderBy) {
      const orderBy = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      processed.sort((a, b) => {
        for (const field of orderBy) {
          const aValue = (a as any)[field];
          const bValue = (b as any)[field];
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
        }
        return 0;
      });
    }

    // 应用分页
    if (options.limit !== undefined || options.offset !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      processed = processed.slice(start, end);
    }

    return processed;
  }
} 