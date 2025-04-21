import { IDataService, DataServiceConfig } from '../types';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import type { DatabaseBatchOperation } from '@/core/lib/db/types';
import { BaseDatabaseClient } from './base-database-client';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';

/**
 * IndexedDBDatabaseClient
 * 实现 IDataService 接口，组合 IndexedDBClient 实现
 */
export class IndexedDBDatabaseClient extends BaseDatabaseClient {
  private client: IndexedDBClient;
  private initialized = false;
  protected config: DataServiceConfig;
  private db: any = {}; // Added for compatibility, remove if not needed

  constructor(config: DataServiceConfig) {
    super(config);
    this.client = new IndexedDBClient(extractDatabaseConfig(config));
    this.config = config;
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
    this.initialized = true;
    this.db = {}; // mock db, remove if not needed
    // 可根据 config 处理缓存、加密等扩展
  }

  async connect(): Promise<void> {
    await this.client.connect();
    // ...连接 IndexedDB
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    // ...断开 IndexedDB
  }

  async clear(): Promise<void> {
    await this.client.clear();
    // ...清空 IndexedDB
    this.cacheClear();
  }

  async query<T>(tableName: string, options?: any): Promise<T[]> {
    return this.cacheGetOrQuery(`${tableName}:query:${JSON.stringify(options)}`, async () => {
      // 兼容 IDataService 接口，返回纯数组
      const res = await this.client.query<T>(tableName, options);
      return res.data;
    });
  }

  async findOne<T>(tableName: string, id: string): Promise<T | null> {
    return this.cacheGetOrQuery(`${tableName}:${id}`, async () => {
      // ...IndexedDB 查找逻辑
      return this.client.findById<T>(tableName, id);
    });
  }

  async findAll<T>(tableName: string, query?: any): Promise<T[]> {
    return this.cacheGetOrQuery(`${tableName}:findAll:${JSON.stringify(query)}`, async () => {
      // 兼容 IDataService 接口，返回纯数组
      const res = await this.client.query<T>(tableName, query);
      return res.data;
    });
  }

  async insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T> {
    const res = await this.client.create<T>(tableName, data);
    this.cacheInvalidate(`${tableName}:${res.id}`);
    this.emit('insert', res);
    return res;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null> {
    const res = await this.client.update<T>(tableName, id, data);
    this.cacheInvalidate(`${tableName}:${id}`);
    this.emit('update', id, data);
    // 查询并返回最新对象
    return this.client.findById<T>(tableName, id);
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.client.delete(tableName, id);
    this.cacheInvalidate(`${tableName}:${id}`);
    this.emit('delete', id);
  }

  async batch<T>(tableName: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.client.batch(tableName, operations as DatabaseBatchOperation[]);
  }

  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    return this.client.executeRawQuery(query, params);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    // 简单模拟事务（IndexedDB 原生不支持多表事务）
    return await fn();
  }

  // async create<T>(collection: string, data: Partial<T>): Promise<T> {
    // 直接复用 insert 逻辑
    // return await this.insert(collection, data);
  // }

  async beginTransaction(): Promise<void> {
    // IndexedDB does not support multi-table transactions natively; this is a no-op or can be simulated if needed
    // You may want to log or throw if strict transaction support is required
    return Promise.resolve();
  }

  async commitTransaction(): Promise<void> {
    // IndexedDB does not support multi-table transactions natively; this is a no-op
    return Promise.resolve();
  }

  async rollbackTransaction(): Promise<void> {
    // IndexedDB does not support multi-table transactions natively; this is a no-op
    return Promise.resolve();
  }

  getType(): string {
    return 'indexeddb';
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): DataServiceConfig {
    return this.config;
  }
}
