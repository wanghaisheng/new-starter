import { BaseEntity } from './base-entity';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

// 数据库引擎类型
export type DatabaseEngine = 'mock' | 'indexeddb' | 'sqlite' | 'cloudflare-d1' | 'firebase' | 'supabase' | 'turso' | 'tidb' | 'postgres';

// 同步策略类型
export type SyncStrategy = 'immediate' | 'periodic' | 'manual';

// 同步状态类型
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

// 数据库配置接口
export interface DatabaseConfig {
  name: string;
  version: number;
  engine: string;
  encryptionKey?: string;
  sync?: {
    enabled: boolean;
    strategy: SyncStrategy;
    interval?: number; // in milliseconds
    retryAttempts?: number;
    retryDelay?: number; // in milliseconds
    conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
  };
  offline: {
    maxStorageSize: number;
    maxEntitiesPerTable: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  tables: {
    [key: string]: {
      columns: {
        [key: string]: {
          type: string;
          constraints?: string[];
        };
      };
      indexes?: {
        [key: string]: {
          columns: string[];
          unique?: boolean;
        };
      };
    };
  };
}

// 数据库版本接口
export interface DatabaseVersion {
  version: number;
  statements: string[];
}

// 数据库错误接口
export interface DatabaseError extends Error {
  code: string;
  details?: any;
}

// 查询操作符类型
export type QueryOperator = '==' | '<' | '<=' | '>' | '>=' | '!=' | '$in' | '$ne' | '$contains' | '$gt' | '$lt' | '$gte' | '$lte' | '$and' | '$or';

// 查询选项接口
export interface QueryOptions {
  where?: {
    field: string;
    operator: QueryOperator;
    value: any;
  } | {
    $and?: QueryOptions['where'][];
    $or?: QueryOptions['where'][];
    [key: string]: any;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

// 同步状态接口
export interface SyncState {
  status: SyncStatus;
  lastSync?: Date;
  error?: Error;
  progress?: number;
}

// 数据库统计接口
export interface DatabaseStats {
  totalRecords: number;
  totalSize: number;
  lastSyncTime?: Date;
  lastError?: DatabaseError;
}

// 数据库结果接口
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// 数据库事务接口
export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

// 数据库事件类型
export type DatabaseEvent = 
  | 'initialized'
  | 'closed'
  | 'error'
  | 'syncStarted'
  | 'syncCompleted'
  | 'syncFailed'
  | 'backupCreated'
  | 'backupRestored';

// 数据库事件处理器类型
export type DatabaseEventHandler = (event: DatabaseEvent, data?: any) => void;

// 批量操作接口
export interface BatchOperation<T> {
  type: 'add' | 'put' | 'delete';
  data: T;
}

// 查询结果接口
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// 数据库指标接口
export interface DatabaseMetrics {
  queryCount: number;
  queryTime: number;
}

// 存储统计接口
export interface StorageStats {
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
}

// 数据库客户端接口
export interface DatabaseClient {
  db: SQLiteDBConnection;
  config: DatabaseConfig;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  create<T extends BaseEntity>(table: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById<T extends BaseEntity>(table: string, id: string): Promise<T | null>;
  findAll<T extends BaseEntity>(table: string, filter?: Record<string, any>): Promise<T[]>;
  update<T extends BaseEntity>(table: string, id: string, data: Partial<T>): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  clear(): Promise<void>;
  initialize(): Promise<void>;
  query<T extends BaseEntity>(table: string, options: QueryOptions): Promise<QueryResult<T>>;
  batch<T extends BaseEntity>(table: string, operations: BatchOperation<T>[]): Promise<void>;
  executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;
  count(table: string, filter?: Record<string, any>): Promise<number>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 查询过滤操作符
 */
export type FilterOperator =
  | '='
  | '=='
  | 'eq'
  | '!='
  | 'ne'
  | 'neq'
  | '>'
  | 'gt'
  | '>='
  | 'gte'
  | '<'
  | 'lt'
  | '<='
  | 'lte'
  | 'in'
  | 'not-in'
  | 'notIn'
  | 'array-contains'
  | 'contains'
  | 'array-contains-any'
  | 'containsAny';

/**
 * 查询过滤条件
 */
export interface QueryFilter {
  /**
   * 字段名
   */
  field: string;
  
  /**
   * 操作符
   */
  operator: FilterOperator | string;
  
  /**
   * 比较值
   */
  value: any;
}

/**
 * 查询选项扩展 - 支持标准和数据库特定功能
 */
export interface ExtendedQueryOptions extends QueryOptions {
  /**
   * 过滤条件数组
   * 提供了比简单的 where 更灵活的过滤方式
   */
  filters?: QueryFilter[];
  
  /**
   * 排序条件
   * 键为字段名，值为排序方向
   */
  sort?: Record<string, SortDirection>;
  
  /**
   * 游标 - 从指定文档之后开始
   */
  startAfter?: any;
  
  /**
   * 游标 - 从指定文档开始
   */
  startAt?: any;
  
  /**
   * 游标 - 到指定文档之前结束
   */
  endBefore?: any;
  
  /**
   * 游标 - 到指定文档结束
   */
  endAt?: any;
  
  /**
   * 分页偏移量
   * 注意：有些数据库引擎不支持偏移，如 Firestore
   */
  offset?: number;
} 