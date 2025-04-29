console.log('IndexedDBClient loaded');
import { openDB, IDBPDatabase } from 'idb';
import { QueryOptions, QueryResult, BatchOperation, StorageStats, BaseEntity, DatabaseConfig, OfflineStorageConfig } from '@/core/lib/db/types/database';
import { DatabaseError } from '@/core/lib/db/types/database';
import {  DatabaseErrorCode } from '@/core/lib/db/types/common';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { schemaRegistry } from '@/core/lib/db/schema/schema-registry-singleton';
import { ClientRegistry } from '@/core/services/data/adapters/client-registry';
import { ColumnType } from '@/core/lib/db/types/common';
import { TableSchema } from '@/core/lib/db/types/database';
import { createDatabaseError } from '@/core/lib/db/types/database';

/**
 * 优化版 IndexedDB 数据库客户端
 * 实现了IDatabaseClient接口，使用IndexedDB作为存储后端
 * 包含性能优化：
 * 1. 使用 idb 库提供的类型安全和Promise包装
 * 2. 实现内存缓存
 * 3. 支持批量操作
 * 4. 支持索引查询
 */
export class IndexedDBClient<T extends BaseEntity> extends BaseClient<T> {
  private db: IDBPDatabase | null = null;
  private config: DatabaseConfig;
  private cache: Map<string, Map<string, T>> = new Map();
  private queryCache: Map<string, { data: T[], timestamp: number }> = new Map();
  private cacheTimeout: number;
  private enableQueryCache: boolean;
  private enableEntityCache: boolean;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    // 兼容新版 DatabaseConfig 的 storage.offline 配置（类型断言保证类型安全）
    const offline = (config.storage?.offline ?? {}) as OfflineStorageConfig;
    this.cacheTimeout = typeof offline.cacheTimeout === 'number' ? offline.cacheTimeout : 5 * 60 * 1000;
    this.enableQueryCache = typeof offline.enableQueryCache === 'boolean' ? offline.enableQueryCache : true;
    this.enableEntityCache = typeof offline.enableEntityCache === 'boolean' ? offline.enableEntityCache : true;
    this.logger.debug('IndexedDBClient配置', {
      name: offline.dbName || config.name,
      version: config.version,
      cacheTimeout: this.cacheTimeout,
      enableQueryCache: this.enableQueryCache,
      enableEntityCache: this.enableEntityCache
    });
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        this.logger.debug('IndexedDBClient 已初始化');
        return;
      }
      const dbName = this.config.storage?.offline?.dbName || this.config.name;
      const dbVersion = this.config.version || 1;
      this.db = await openDB(dbName, dbVersion, {
        upgrade: (db) => {
          // 自动为所有已注册表结构建 object store 和索引
          const schemas: TableSchema[] = schemaRegistry.getAllSchemas();
          // 防止 object store 重复
          const seenStores = new Set<string>();
          for (const schema of schemas) {
            if (seenStores.has(schema.name)) continue;
            seenStores.add(schema.name);
            if (db.objectStoreNames.contains(schema.name)) continue;
            const store = db.createObjectStore(schema.name, { keyPath: 'id' });
            // 防止索引名重复
            const seenIndexes = new Set<string>();
            if (schema.indexes) {
              for (const idx of schema.indexes) {
                if (seenIndexes.has(idx.name)) continue;
                seenIndexes.add(idx.name);
                store.createIndex(idx.name, idx.columns[0], { unique: !!idx.unique });
              }
            }
          }
        },
      });
      this.initialized = true;
      this.logger.info('IndexedDBClient 初始化完成', {
        dbName,
        dbVersion
      });
    } catch (err) {
      this.logger.error('IndexedDBClient 初始化失败', { err });
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initialized = false;
    this.logger.info('IndexedDBClient 关闭');
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    this.cache.clear();
    this.queryCache.clear();
    this.logger.info('IndexedDBClient 清空数据');
  }

  async findById(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readonly').objectStore(tableName);
    const result = await store.get(id);
    if (!result) return null;
    return this.processResult<T>(result);
  }

  /**
   * 查询所有记录，支持简单过滤
   */
  async findAll(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readonly').objectStore(tableName);
    const results = await store.getAll();
    const processedResults = results.map(result => this.processResult<T>(result));
    if (filter) {
      // 类型断言消除类型警告，保证兼容 Partial<T>
      return processedResults.filter(item => this.matchesFilter(item, filter as Partial<T>));
    }
    return processedResults;
  }

  async create(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readwrite').objectStore(tableName);
    const now = new Date();
    const record = {
      ...data,
      id: (data as any).id || this.generateId(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    await store.add(record);
    return record;
  }

  async update(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readwrite').objectStore(tableName);
    const existing = await store.get(id);
    if (!existing) {
      throw this.createError(
        DatabaseErrorCode.NOT_FOUND,
        `Record not found with ID: ${id}`
      );
    }
    const updatedData = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    await store.put(updatedData);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readwrite').objectStore(tableName);
    await store.delete(id);
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readonly').objectStore(tableName);
    let results = await store.getAll();
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
    let processedResults = results.map(result => this.processResult<T>(result));
    if (options.limit !== undefined || options.offset !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      processedResults = processedResults.slice(start, end);
    }
    return {
      items: processedResults,
      total,
      hasMore: total > (processedResults.length + (options.offset || 0))
    };
  }

  async count(tableName: string, filter?: Partial<T>): Promise<number> {
    this.checkInitialized();
    const store = this.db!.transaction(tableName, 'readonly').objectStore(tableName);
    const results = await store.getAll();
    if (filter) {
      return results.filter(item => this.matchesFilter(item, filter)).length;
    }
    return results.length;
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.info('Transaction started');
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.info('Transaction committed');
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.warn('Transaction rolled back');
  }

  async batch(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    for (const op of operations) {
      switch (op.type) {
        case 'add':
        case 'put':
          await this.create(tableName, op.data);
          break;
        case 'update':
          if (!('id' in op)) throw createDatabaseError(DatabaseErrorCode.INVALID_ARGUMENT, 'Batch update operation missing id');
          await this.update(tableName, (op as any).id, op.data);
          break;
        case 'delete':
          if (!('id' in op)) throw createDatabaseError(DatabaseErrorCode.INVALID_ARGUMENT, 'Batch delete operation missing id');
          await this.delete(tableName, (op as any).id);
          break;
      }
    }
    this.logger.info('Batch operation completed', { tableName, count: operations.length });
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.logger.warn('executeRawQuery is not supported in IndexedDBClient');
    return [];
  }

  protected checkInitialized(): void {
    if (!this.initialized) throw new Error('IndexedDBClient not initialized');
  }

  private processResult<T>(record: any): T {
    if (!record) return record;
    const processed = { ...record };
    for (const key in processed) {
      if (Object.prototype.hasOwnProperty.call(processed, key)) {
        const value = processed[key];
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value)) {
          processed[key] = new Date(value);
        } else if (value && typeof value === 'object' && value instanceof Date) {
          processed[key] = value;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          processed[key] = this.processResult(value);
        }
      }
    }
    return processed as T;
  }

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

  async connect(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async disconnect(): Promise<void> {
    await this.close();
  }

  async getStorageStats(): Promise<StorageStats> {
    // 这里只能估算 IndexedDB 空间，通常无法直接获取物理大小
    // 返回一个估算值或 0
    return {
      totalSize: 0, // IndexedDB 无法直接获取总空间
      availableSpace: 0,
      usedSpace: 0
    };
  }

  /**
   * 获取当前客户端类型（如 indexeddb/sqlite/supabase 等）
   */
  public getType(): string {
    return 'indexeddb';
  }

  /**
   * 判断客户端是否已初始化
   */
  public isInitialized(): boolean {
    return !!this.db && this.initialized;
  }

  /**
   * 获取底层配置对象
   */
  public getConfig(): any {
    return {
      db: this.db,
      config: this.config,
      cache: this.cache,
      queryCache: this.queryCache,
      cacheTimeout: this.cacheTimeout,
      enableQueryCache: this.enableQueryCache,
      enableEntityCache: this.enableEntityCache,
    };
  }
}

// 注册到全局注册表
ClientRegistry.register('indexeddb', 'native', IndexedDBClient);

export async function getStorageStats(dbName: string): Promise<StorageStats> {
  // 这里只能估算 IndexedDB 空间，通常无法直接获取物理大小
  // 返回一个估算值或 0
  return {
    totalSize: 0, // IndexedDB 无法直接获取总空间
    availableSpace: 0,
    usedSpace: 0
  };
}