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
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { User } from '@/core/lib/db/types/user';
import type { TestType, TestResult } from '@/core/lib/db/types/test';
import type { Match } from '@/core/lib/db/types/match';
import type { Message } from '@/core/lib/db/types/message';
import type {
  QueryResult,
  BatchOperation,
  DatabaseEngine,
  SyncStrategy,
  SyncStatus,
  QueryOptions,
  SyncConfig,
  HybridDatabaseConfig,
  DatabaseConfig,
  DatabaseClient
} from '@/core/lib/db/types/database.types';
import type {
  SyncPriority,
  ConflictResolution,
  SyncMetadata,
  SyncableEntity
} from '@/core/lib/db/types/sync-flags';

// 导出公共类型供外部使用
export type { 
  SyncStrategy, 
  SyncStatus, 
  DatabaseEngine,
  SyncConfig,
  HybridDatabaseConfig,
  DatabaseConfig,
  QueryResult,
  BatchOperation,
  QueryOptions,
  SyncPriority,
  ConflictResolution,
  SyncMetadata,
  SyncableEntity,
  User,
  Match,
  Message,
  TestType,
  TestResult
};

// 基础数据库客户端接口
export interface IBaseDatabaseClient<T extends BaseEntity = BaseEntity> {
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  findById(tableName: string, id: string): Promise<T | null>;
  findAll(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create(tableName: string, data: Partial<T>): Promise<T>;
  update(tableName: string, id: string, data: Partial<T>): Promise<T>;
  delete(tableName: string, id: string): Promise<boolean>;
  
  query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  count(tableName: string, filter?: Record<string, any>): Promise<number>;
  
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch(tableName: string, operations: BatchOperation<T>[]): Promise<void>;
  executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
}

// 数据服务接口
export interface IDataService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  
  // 用户相关
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phoneNumber: string): Promise<User | null>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // 测试相关
  getTestTypes(): Promise<TestType[]>;
  getTestType(id: string): Promise<TestType | null>;
  getUserTestResults(userId: string): Promise<TestResult[]>;
  getTestResult(userId: string, testId: string): Promise<TestResult | null>;
  saveTestResult(result: Partial<TestResult>): Promise<TestResult>;
  
  // 数据库操作
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch<T>(tableName: string, operations: BatchOperation<T>[]): Promise<void>;
  executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;
}

// 数据库客户端接口
export interface IDatabaseClient extends IBaseDatabaseClient {
  connect(config?: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  query<T>(collection: string, query: any): Promise<QueryResult<T>>;
  findById<T>(collection: string, id: string): Promise<T | null>;
  create<T>(collection: string, data: Partial<T>): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
}

// 同步客户端接口
export interface ISyncClient extends IDatabaseClient {
  // 同步方法
  sync(): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
  cancelSync(): Promise<void>;
}

// 数据库事务接口
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