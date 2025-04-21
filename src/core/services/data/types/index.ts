import type { BaseEntity, DatabaseConfig, DatabaseEngine, SyncConfig } from '@/core/lib/db/types/database.types';
import { IService, ServiceConfig } from '@/core/services/types';

// 数据服务通用查询结果
export interface QueryResult<T> {
  data: T[];
  total: number;
}

// 数据服务配置
export interface DataServiceConfig extends ServiceConfig {
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
        drizzle?: {
          url: string;
          schema?: string;
        };
      };
    };
  } & ServiceConfig['services'];
  cache?: boolean;
  encryption?: {
    enabled: boolean;
    key: string;
    fields?: string[];
  };
}

// 数据服务接口
export interface IDataService extends IService {
  initialize(config?: ServiceConfig): Promise<void>;
  dispose(): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  query<T>(tableName: string, options?: any): Promise<T[]>;
  findOne<T extends { id: string }>(tableName: string, id: string): Promise<T | null>;
  insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T>;
  update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(tableName: string, id: string): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch<T>(tableName: string, operations: Array<{
    type: 'insert' | 'update' | 'delete';
    data?: T | Partial<T>;
    id?: string;
  }>): Promise<void>;
  executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;
  getType(): string;
  isInitialized(): boolean;
  getConfig(): ServiceConfig;
  on?(event: string, handler: (...args: any[]) => void): void;
  off?(event: string, handler: (...args: any[]) => void): void;
}

// 数据服务工厂接口
export interface IDataServiceFactory {
  createService(config: DataServiceConfig): IDataService;
}