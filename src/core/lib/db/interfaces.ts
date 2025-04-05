/**
 * 数据库接口定义
 * 定义了数据库客户端和仓储的接口
 */

/**
 * 数据库接口定义
 * 定义了数据库客户端和仓储的接口
 */

/**
 * 数据库接口定义文件
 * 定义了数据库客户端、仓储和事务的接口
 */

// 导入类型定义 - 统一从各自的模块导入
import { TableSchema } from './schema';
import { User, Match, Message } from './types';
import { BaseEntity } from './types/base-entity';
import { 
  QueryResult, 
  BatchOperation, 
  DatabaseEngine, 
  SyncStrategy, 
  SyncStatus,
  QueryOptions,
  SyncConfig,
  HybridDatabaseConfig,
  DatabaseConfig
} from './types/database.types';
import { 
  SyncPriority, 
  ConflictResolution, 
  SyncConfig as SyncConfigFlags,
  SyncState,
  SyncMetadata,
  SyncableEntity
} from './types/sync-flags';

// 导出公共类型供外部使用
export type { 
  SyncStrategy, 
  SyncStatus, 
  DatabaseEngine,
  SyncConfig,
  HybridDatabaseConfig,
  DatabaseConfig
} from './types/database.types';

export type { 
  SyncPriority, 
  ConflictResolution, 
  SyncConfig as SyncFlagsConfig,
  SyncState,
  SyncMetadata,
  SyncableEntity
} from './types/sync-flags';

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

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match>;
  createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>;

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