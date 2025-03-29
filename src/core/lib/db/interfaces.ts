import { User, Match, Message } from './types';
import { TableSchema } from './schema';

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
export interface IBaseDatabaseClient {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById<T>(tableName: string, id: string): Promise<T | null>;
  findAll<T>(tableName: string): Promise<T[]>;
  create<T>(tableName: string, data: T): Promise<T>;
  update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  query<T>(tableName: string, query: any): Promise<T[]>;
  count(tableName: string, query?: any): Promise<number>;
  
  // 事务支持
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

// 完整数据库客户端接口 - 包含特定于表的方法（向后兼容）
// 完整数据库客户端接口 - 使用通用实体方法
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
}

// 同步客户端接口
export interface ISyncClient extends IDatabaseClient {
  // 同步方法
  sync(): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
  cancelSync(): Promise<void>;
}
  