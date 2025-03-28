import { User } from '@/core/models/user';
import { Match } from '@/core/models/match';
import { Message } from '@/core/models/message';

// 数据库引擎类型
export type DatabaseEngine = 
  'mock' | 
  'indexeddb' | 
  'sqlite' | 
  'cloudflare-d1' | 
  'firebase' | 
  'supabase' | 
  'turso' | 
  'tidb' | 
  'postgres';

// 数据库配置接口
export interface DatabaseConfig {
  engine: DatabaseEngine;
  name?: string;
  version?: number;
  
  // 通用连接配置
  url?: string;
  key?: string;
  
  // Firebase 配置
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  
  // Cloudflare D1 配置
  accountId?: string;
  apiToken?: string;
  databaseId?: string;
  
  // Turso 配置
  authToken?: string;
  
  // TiDB/PostgreSQL 配置
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

// 同步策略类型
export type SyncStrategy = 'online-first' | 'offline-first' | 'manual';

// 同步状态接口
export interface SyncStatus {
  lastSyncTimestamp: number;
  pendingChanges: number;
  isSyncing: boolean;
}

// 同步配置接口
export interface SyncConfig {
  localClient: IDatabaseClient;
  remoteClient: IDatabaseClient;
  syncStrategy?: SyncStrategy;
  syncIntervalMs?: number;
  maxSyncRetries?: number;
  syncRetryDelayMs?: number;
  conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins' | 'manual';
}

// 混合数据库客户端配置
export interface HybridDatabaseConfig extends SyncConfig {
  syncStrategy: SyncStrategy;
}

// 基础数据库客户端接口 - 通用数据访问方法
export interface IBaseDatabaseClient {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById<T>(tableName: string, id: string): Promise<T | null>;
  findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create<T extends { id: string }>(tableName: string, data: T): Promise<T>;
  update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]>;
  
  // 原始查询接口
  executeRawQuery(query: string, params?: any[]): Promise<any>;
  
  // 事务支持
  transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
  
  // 表操作
  isTableExists(tableName: string): Promise<boolean>;
}

// 完整数据库客户端接口 - 包含特定于表的方法（向后兼容）
// 完整数据库客户端接口 - 使用通用实体方法
export interface IDatabaseClient extends IBaseDatabaseClient {
  // 通用实体操作方法
  saveEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T>;
  getEntity<T>(tableName: string, id: string): Promise<T | null>;
  getAllEntities<T>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  updateEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T>;
  deleteEntity(tableName: string, id: string): Promise<boolean>;
  
  // 特定业务查询方法
  getEntitiesByRelation<T>(
    tableName: string, 
    relationField: string, 
    relationId: string
  ): Promise<T[]>;
}



// 同步客户端接口
export interface ISyncClient extends IDatabaseClient {
  // 同步方法
  manualSync(): Promise<boolean>;
  getSyncStatus(): Promise<SyncStatus>;
  getLastSyncTimestamp(): Promise<number>;
  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void;
}
  