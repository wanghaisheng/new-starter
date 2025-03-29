import { User, Match, Message } from './types';
import { TableSchema } from './schema';
import { QueryResult, BatchOperation } from './types/database.types';
import { BaseEntity } from './types/base-entity';

// 数据库引擎类型
export type DatabaseEngine = 'mock' | 'indexeddb' | 'sqlite' | 'cloudflare-d1' | 'firebase' | 'supabase' | 'turso' | 'tidb' | 'postgres';

// 同步策略类型
export type SyncStrategy = 'immediate' | 'periodic' | 'manual';

// 同步状态类型
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

// 同步配置接口
export interface SyncConfig {
  enabled: boolean;
  strategy: SyncStrategy;
  interval?: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
  conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
}

// 混合数据库客户端配置
export interface HybridDatabaseConfig {
  engine: DatabaseEngine;
  sync?: SyncConfig;
  offline?: {
    maxStorageSize?: number; // in bytes
    maxEntitiesPerTable?: number;
    compressionEnabled?: boolean;
    encryptionEnabled?: boolean;
  };
}

// 数据库配置接口
export interface DatabaseConfig extends HybridDatabaseConfig {
  name?: string;
  version?: number;
  schema?: TableSchema[];
}

// 基础数据库客户端接口 - 通用数据访问方法
export interface IBaseDatabaseClient<T extends BaseEntity = BaseEntity> {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById(tableName: string, id: string): Promise<T | null>;
  findAll(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create(tableName: string, data: T): Promise<T>;
  update(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  count(tableName: string, filter?: Record<string, any>): Promise<number>;
  
  // 事务支持
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;

  // 批量操作
  batch(tableName: string, operations: BatchOperation<T>[]): Promise<void>;

  // 原始查询
  executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
}

// 完整数据库客户端接口 - 包含特定于表的方法（向后兼容）
export interface IDatabaseClient extends IBaseDatabaseClient {
  // 通用实体操作方法
  findUsers(query?: any): Promise<User[]>;
  findMatches(query?: any): Promise<Match[]>;
  findMessages(query?: any): Promise<Message[]>;

  createUser(data: Omit<User, 'id'>): Promise<User>;
  createMatch(data: Omit<Match, 'id'>): Promise<Match>;
  createMessage(data: Omit<Message, 'id'>): Promise<Message>;

  updateUser(id: string, data: Partial<User>): Promise<void>;
  updateMatch(id: string, data: Partial<Match>): Promise<void>;
  updateMessage(id: string, data: Partial<Message>): Promise<void>;

  deleteUser(id: string): Promise<void>;
  deleteMatch(id: string): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // 事务支持
  transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T>;
}

// 同步客户端接口
export interface ISyncClient extends IDatabaseClient {
  // 同步方法
  sync(): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
  cancelSync(): Promise<void>;
}

export interface IDatabaseTransaction {
  findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null>;
  findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create<T extends BaseEntity>(tableName: string, data: T): Promise<T>;
  update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  query<T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void>;
  executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;
  count(tableName: string, filter?: Record<string, any>): Promise<number>;
}

export interface QueryOptions {
  where?: {
    field: string;
    operator: '==' | '<' | '<=' | '>' | '>=' | '!=';
    value: any;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  startAfter?: any;
}

export * from './types/database.types';
  