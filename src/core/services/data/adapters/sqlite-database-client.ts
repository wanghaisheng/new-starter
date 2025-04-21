import { IDataService, DataServiceConfig } from '../types';
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import type { DatabaseBatchOperation } from '@/core/lib/db/types';
import { BaseDatabaseClient } from './base-database-client';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';

/**
 * SqliteDatabaseClient
 * 实现 IDataService 接口，组合 SQLiteClient 实现
 */
export class SqliteDatabaseClient extends BaseDatabaseClient {
  private client: SQLiteClient;
  private initialized = false;
  protected config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    super(config);
    this.client = new SQLiteClient(extractDatabaseConfig(config));
    this.config = config;
  }

  async initialize(): Promise<void> {
    await this.client.initialize();
    this.initialized = true;
    // 可根据 config 处理缓存、加密等扩展
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async clear(): Promise<void> {
    await this.client.clear();
    this.cacheClear();
  }

  async query<T>(tableName: string, options?: any): Promise<T[]> {
    return this.cacheGetOrQuery(`${tableName}:query:${JSON.stringify(options)}`, async () => {
      return this.client.query<T>(tableName, options).then(res => res.data);
    });
  }

  async findOne<T>(tableName: string, id: string): Promise<T | null> {
    return this.cacheGetOrQuery(`${tableName}:${id}`, async () => {
      return this.client.findById<T>(tableName, id);
    });
  }

  async findAll<T>(tableName: string, filter?: Record<string, unknown>): Promise<T[]> {
    return this.cacheGetOrQuery(`${tableName}:query:${JSON.stringify(filter)}`, async () => {
      return this.client.findAll<T>(tableName, filter);
    });
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    return this.cacheGetOrQuery(`${collection}:${id}`, async () => {
      return this.client.findById<T>(collection, id);
    });
  }

  async insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T> {
    const res = await this.client.create<T>(tableName, data);
    this.cacheInvalidate(`${tableName}:${res.id}`);
    this.emit('insert', res);
    return res;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null> {
    await this.client.update<T>(tableName, id, data);
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

  async beginTransaction(): Promise<void> {
    await this.client.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    await this.client.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    await this.client.rollbackTransaction();
  }

  async batch<T>(tableName: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.client.batch(tableName, operations as DatabaseBatchOperation[]);
  }

  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    return this.client.executeRawQuery(query, params);
  }

  async count(collection: string, filter?: Record<string, unknown>): Promise<number> {
    return this.client.count(collection, filter);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  getType(): string {
    return 'sqlite';
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): DataServiceConfig {
    return this.config;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    // No-op for compatibility
  }

  off(event: string, handler: (...args: any[]) => void): void {
    // No-op for compatibility
  }
}
