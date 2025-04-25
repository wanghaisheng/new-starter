import { BaseClient } from '@/core/lib/db/clients/base-client';
import type { IDataService, DataServiceConfig } from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import type { DatabaseEvent } from '@/core/lib/db/types/database';

// 事件与缓存机制基类，继承底层 BaseClient
export abstract class BaseDatabaseClient<T extends BaseEntity = BaseEntity> extends BaseClient<T> implements IDataService {
  private cacheEnabled = false;
  private cache = new Map<string, any>();

  constructor(config?: DataServiceConfig) {
    super();
    if (config?.cache) this.cacheEnabled = true;
  }

  // 事件API，兼容父类签名
  on(event: DatabaseEvent, listener: Function): () => void {
    return super.on(event, listener);
  }
  off(event: DatabaseEvent, listener: Function): void {
    super.off(event, listener);
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

  // Abstract methods for IDataService compliance (签名与 BaseClient 保持一致)
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract clear(): Promise<void>;
  abstract findOne(tableName: string, id: string): Promise<T | null>;
  abstract query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  abstract insert(tableName: string, data: Partial<T>): Promise<T>;
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

  // 可选销毁
  async dispose(): Promise<void> {
    this.cacheClear();
    await this.disconnect();
  }
}
