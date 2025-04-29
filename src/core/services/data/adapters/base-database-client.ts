import { BaseClient } from '@/core/lib/db/clients/base-client';
import type { IDataService, DataServiceConfig, IDataServiceEvent, IDataServiceEventListenerMap } from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import type { DatabaseEventCode } from '@/core/lib/db/types/common';

// 事件与缓存机制基类，继承底层 BaseClient
export abstract class BaseDatabaseClient<T extends BaseEntity = BaseEntity>
  extends BaseClient<
    T,
    IDataServiceEventListenerMap,
    IDataServiceEvent
  > implements IDataService<T> {
  private cacheEnabled = false;
  private cache = new Map<string, any>();

  constructor(config?: DataServiceConfig) {
    super();
    // 推荐：根据 cacheProvider 或 cacheStrategy 判断是否启用内存缓存
    const options = config?.services?.data?.options;
    if (options?.cacheProvider === 'memory' || options?.cacheStrategy === 'memory') {
      this.cacheEnabled = true;
    }
  }

  // 缓存包装
  protected async cacheGetOrQuery<K>(key: string, queryFn: () => Promise<K>): Promise<K> {
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key);
    }
    const result = await queryFn();
    if (this.cacheEnabled) this.cache.set(key, result);
    return result;
  }
  protected cacheInvalidate(key: string) {
    if (this.cacheEnabled) this.cache.delete(key);
  }
  protected cacheClear() {
    if (this.cacheEnabled) this.cache.clear();
  }

  // Abstract methods for IDataService compliance
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract clear(): Promise<void>;
  abstract findById(tableName: string, id: string): Promise<T | null>;
  abstract query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  abstract create(tableName: string, data: T): Promise<T>;
  abstract update(tableName: string, id: string, data: Partial<T>): Promise<void>;
  abstract delete(tableName: string, id: string): Promise<void>;
  abstract beginTransaction(): Promise<void>;
  abstract commitTransaction(): Promise<void>;
  abstract rollbackTransaction(): Promise<void>;
  abstract batch(tableName: string, operations: any[]): Promise<void>;
  abstract executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
  abstract getType(): string;
  abstract isInitialized(): boolean;
  abstract getConfig(): any;
  abstract initialize(config?: DataServiceConfig): Promise<void>;
  abstract createMany(tableName: string, data: T[]): Promise<T[]>;
  abstract updateMany(tableName: string, ids: string[], updates: Partial<T>): Promise<number>;
  abstract deleteMany(tableName: string, ids: string[]): Promise<number>;
  abstract findAll(tableName: string, filter?: Record<string, any>): Promise<T[]>;

  async get(key: string): Promise<any> {
    // 默认内存缓存实现
    return this.cache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
  }

  // 可选销毁
  async dispose(): Promise<void> {
    this.cacheClear();
    await this.disconnect();
  }
}
