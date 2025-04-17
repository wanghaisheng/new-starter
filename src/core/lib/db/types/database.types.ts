import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { BaseEntity } from './base-entity';
import { TableSchema } from '../schema/index';

// 数据库引擎类型
export type DatabaseEngine = 'mock' | 'mock-indexeddb' | 'indexeddb' | 'sqlite' | 'capacitor-sqlite' | 'cloudflare-d1' | 'firebase' | 'supabase' | 'turso' | 'tidb' | 'postgres' | 'hybrid';

// 同步策略类型
export type SyncStrategy = 'immediate' | 'periodic' | 'manual';

// 同步状态类型
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

// 同步配置接口
export interface SyncConfig {
  enabled: boolean;
  strategy: SyncStrategy;
  /**
   * 是否仅离线存储，不同步到云端
   */
  offlineOnly?: boolean;
  interval?: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
  conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
  /**
   * 本地客户端实例 - 由HybridDatabaseClient使用
   */
  localClient?: any;
  /**
   * 远程客户端实例 - 由HybridDatabaseClient使用
   */
  remoteClient?: any;
  /**
   * 同步间隔（毫秒）
   */
  syncIntervalMs?: number;
  /**
   * 最大重试次数
   */
  maxSyncRetries?: number;
  /**
   * 重试延迟（毫秒）
   */
  syncRetryDelayMs?: number;
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
  name: string;
  version: number;
  encryptionKey?: string;
  schema?: TableSchema[];
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
  | 'in';

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

/**
 * 游标相关配置
 */
export interface CursorOptions {
  /**
   * 开始位置的游标值（包含）
   */
  startAt?: any;
  
  /**
   * 开始位置的游标值（不包含）
   */
  startAfter?: any;
  
  /**
   * 结束位置的游标值（包含）
   */
  endAt?: any;
  
  /**
   * 结束位置的游标值（不包含）
   */
  endBefore?: any;
  
  /**
   * 跳过的记录数
   */
  offset?: number;
}

export type DatabaseEnvironment = 'development' | 'production';
export type StorageType = 'memory' | 'indexeddb' | 'sqlite' | 'postgres';
export type DemoDataSource = 'example' | 'dating';

export interface DatabaseConnection {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  path?: string;
}

export interface StorageConfig {
  type: StorageType;
  connection: DatabaseConnection;
}

export interface TestDataConfig {
  loadOnStartup: boolean;
  source: DemoDataSource;
}

export interface EnvironmentConfig {
  environment: DatabaseEnvironment;
  enableOffline: boolean;
  enableHybrid: boolean;
}

export interface DatabaseConfig {
  name: string;
  version: number;
  engine: DatabaseEngine;
  tables: Record<string, TableConfig>;
  env: EnvironmentConfig;
  storage: {
    online: StorageConfig;
    offline: StorageConfig;
  };
  sync: SyncConfig;
  testData: TestDataConfig;
}

export interface TableConfig {
  columns: Record<string, ColumnConfig>;
  indexes: IndexConfig[];
}

export interface ColumnConfig {
  type: string;
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  defaultValue?: any;
}

export interface IndexConfig {
  columns: string[];
  unique?: boolean;
}

export const defaultConfig: DatabaseConfig = {
  name: 'app_database',
  version: 1,
  engine: 'mock',
  tables: {},
  env: {
    environment: 'development',
    enableOffline: false,
    enableHybrid: false
  },
  storage: {
    online: {
      type: 'memory',
      connection: {}
    },
    offline: {
      type: 'indexeddb',
      connection: {}
    }
  },
  sync: {
    enabled: false,
    strategy: 'auto',
    conflictResolution: 'server-wins',
    syncIntervalMs: 0
  },
  testData: {
    loadOnStartup: false,
    source: 'example'
  }
}; 

export type { BaseEntity } from './base-entity';