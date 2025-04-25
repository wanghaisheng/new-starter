import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';

// 数据服务配置
export interface DataServiceConfig {
  services: {
    data: {
      adapter: 'firebase' | 'mock' | 'sqlite' | 'indexeddb' | 'drizzle';
      options?: {
        firebase?: {
          apiKey: string;
          authDomain: string;
          projectId: string;
          storageBucket: string;
          messagingSenderId: string;
          appId: string;
        };
        sqlite?: {
          name: string;
          location?: string;
          encryption?: boolean;
        };
        indexeddb?: {
          name: string;
          version?: number;
          tables?: Record<string, any>;
          engine?: string;
          autoSave?: boolean;
          encryptionKey?: string;
        };
      };
    };
  };
}

export interface IDataService<T extends BaseEntity = BaseEntity> {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  findOne(tableName: string, id: string): Promise<T | null>;
  query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  insert(tableName: string, data: Partial<T>): Promise<T>;
  update(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch(tableName: string, operations: any[]): Promise<void>;
  executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
  getType(): string;
  isInitialized(): boolean;
  getConfig(): any;
  initialize(config?: any): Promise<void>;
}