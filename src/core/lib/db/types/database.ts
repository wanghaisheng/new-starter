console.log('base-entity loaded');

/**
 * 基础实体类型
 * 所有数据库实体都应该继承这个类
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * 可同步基础实体
 * 适用于需要离线存储和远程同步的实体
 */
export interface SyncableBaseEntity extends BaseEntity, SyncableEntity {
  _tableName?: string;
  constructor?: { name: string };
}

/**
 * 数据库记录类型
 * 用于数据库中存储的原始记录格式
 */
export interface DatabaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * 可同步数据库记录类型
 * 包含同步相关字段
 */


/**
 * 创建实体数据类型
 * 用于创建实体时的数据类型定义
 */
export type CreateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 更新实体数据类型
 * 用于更新实体时的数据类型定义
 */
export type UpdateEntityData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// =================== 通用数据库类型定义 ===================

// ---- 通用枚举类型全部从 common.ts 导入 ----
import {
  DataMode,
  SortDirection,
  QueryOperator,
  DatabaseEvent,
  SyncState,
  DatabaseErrorCode,
} from './common';

// ---- 类型定义区（接口、类型别名等） ----

// ---- 数据流向/环境 ----

// ---- 排序方向 ----

// ---- 在线存储类型 ----

// ---- 离线存储类型 ----

// ---- 混合存储策略 ----

// ---- 列定义与表结构 ----
// ColumnType 枚举已迁移至 common.ts，请从 '@/core/lib/db/types/common' 引用
// import { ColumnType } from '@/core/lib/db/types/common';

export interface ColumnDefinition {
  name: string;
  type: import('./common').ColumnType;
  primaryKey?: boolean;
  nullable?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defValue?: any;
  references?: {
    table: string;
    column: string;
  };
  onlyFor?: DataMode;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  onlyFor?: DataMode;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  syncConfig?: SyncConfig;
  // 可扩展其它 schema 属性
}

export interface ISchemaRegistry {
  register(schema: TableSchema): void;
  getSchema(name: string): TableSchema | undefined;
  getAllSchemas(target?: DataMode): TableSchema[];
  hasSchema(name: string): boolean;
  removeSchema(name: string): void;
  clear(): void;
}

// ---- 通用数据库类型恢复 ----

export interface QueryOptions {
  where?:
    | {
        field: string;
        operator: QueryOperator;
        value: any;
      }
    | {
        $and?: QueryOptions['where'][];
        $or?: QueryOptions['where'][];
        [key: string]: any;
      };
  orderBy?: {
    field: string;
    direction: SortDirection;
  };
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
}

export interface QueryResult<T> {
  items: T[];
  total?: number; // 可选，支持分页/统计
  [key: string]: any; // 扩展字段
}

export interface BatchOperation<T = any> {
  type: 'add' | 'put' | 'update' | 'delete';
  data: T;
  id?: string; // update/delete 操作时必需
}

export interface StorageConfig {
  online?: OnlineStorageConfig;
  offline?: OfflineStorageConfig;
  hybrid?: HybridStorageConfig;
}

export interface OnlineStorageConfig {
  type: import('./common').OnlineDbProvider;
  url?: string;
  apiKey?: string;
  projectId?: string;
}

export interface OfflineStorageConfig {
  type: import('./common').OfflineDbProvider;
  path?: string;
  dbName?: string;
  mockMode?: boolean;
  cacheTimeout?: number;
  enableQueryCache?: boolean;
  enableEntityCache?: boolean;
}

export interface HybridStorageConfig {
  strategies: import('./common').HybridStrategy[];
  fallback: DataMode;
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

export type Path = string;
export type Password = string;
export type SQLiteConnection = any; // 如有专用类型请替换
export interface QuizDataConfig {
  loadOnStartup: boolean;
  source: 'local' | 'remote' | 'example';
}
export interface EnvironmentConfig {
  envName: string;
  [key: string]: any;
}

// ---- 通用类型补充 ----
export interface StorageStats {
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
}

export interface DatabaseStats {
  totalRecords: number;
  totalSize: number;
  lastSyncTime?: Date;
}

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

export interface DatabaseMetrics {
  queryCount: number;
  queryTime: number;
}

export type FilterOperator =
  | '='
  | '=='
  | '<'
  | '<='
  | '>'
  | '>='
  | '!='
  | '$in'
  | '$ne'
  | '$contains'
  | '$gt'
  | '$lt'
  | '$gte'
  | '$lte'
  | '$and'
  | '$or';

export interface QueryFilter {
  field: string;
  operator: FilterOperator | string;
  value: any;
}

export interface QueryCursor {
  sort?: Record<string, SortDirection>;
  startAfter?: any;
  startAt?: any;
  endBefore?: any;
  endAt?: any;
  offset?: number;
}

export interface CursorOptions {
  startAt?: any;
  startAfter?: any;
  endAt?: any;
  endBefore?: any;
}

export type DatabaseEnvironment = 'mock' | 'local' | 'development' | 'production' | 'test';

export const SUPPORTED_ONLINE_STORAGE_TYPES = [
  'memory',
  'indexeddb',
  'sqlite',
  'fake-indexeddb',
  'capacitor-sqlite',
  'supabase',
  'cloudflare-d1',
  'firebase',
  'turso',
  'tidb',
  'postgres',
  'hybrid',
] as const;

export const SUPPORTED_OFFLINE_STORAGE_TYPES = [
  'memory',
  'indexeddb',
  'sqlite',
  'capacitor-sqlite',
  'mock',
] as const;

// ---- 数据库类型与引擎 ----

export type DatabaseEngine =
  | 'memory'           // 内存型 mock
  | 'json'             // JSON 文件 mock
  | 'mock-indexeddb'   // 浏览器环境 mock IndexedDB
  | 'indexeddb'        // 浏览器 IndexedDB
  | 'localstorage'     // 浏览器 localStorage
  | 'sqlite'           // Node.js/原生 SQLite
  | 'capacitor-sqlite' // 移动端 Capacitor SQLite
  | 'supabase'         // 云端 Supabase
  | 'cloudflare-d1'    // 云端 Cloudflare D1
  | 'firebase'         // 云端 Firebase
  | 'turso'            // 云端 Turso
  | 'tidb'             // 云端 TiDB
  | 'postgres'         // 云端/本地 Postgres
  | 'hybrid';          // 多端混合

// ---- 数据库配置与连接 ----
export interface DatabaseConfig {
  databaseUrl?: string;
  engine: DatabaseEngine;
  name: string;
  version?: number;
  tables: Record<string, TableConfig>;
  storage?: StorageConfig;
  sync?: SyncConfig;
  encryptionKey?: string;
  providerOptions?: Record<string, any>;
  schemas?: TableSchema[];
  envName?: string;

  /** @deprecated 请使用 databaseUrl 替代 */
  path?: Path;
  /** @deprecated 仅 Capacitor/SQLite 场景，建议移除 */
  sqliteConnection?: SQLiteConnection;
  /** @deprecated 请使用 encryptionKey 替代 */
  password?: Password;
  /** @deprecated 业务耦合字段，建议移除 */
  quizData?: QuizDataConfig;
  /** @deprecated 复杂环境配置建议拆分，仅保留 envName */
  env?: EnvironmentConfig;
}

// =================== 同步相关类型 ===================

export interface SyncMetadata {
  /** 同步状态 */
  syncState: SyncState;
  /** 上次同步时间 */
  lastSyncedAt?: Date;
  /** 本地修改时间 */
  localModifiedAt: Date;
  /** 远程修改时间 */
  remoteModifiedAt?: Date;
  /** 同步尝试次数 */
  syncAttempts?: number;
  /** 同步优先级 */
  syncPriority: import('./common').SyncPriority;
  /** 版本标识符（用于乐观锁） */
  version?: number | string;
  /** 冲突解决策略 */
  conflictResolution?: import('./common').ConflictResolution;
  /** 设备ID（用于多设备同步） */
  deviceId?: string;
  /** 额外同步元数据（根据具体环境需要） */
  meta?: Record<string, any>;
}

export interface SyncConfig {
  /** 是否启用同步 */
  enabled: boolean;
  /** 是否仅存储在离线环境 */
  offlineOnly?: boolean;
  /** 默认同步优先级 */
  defaultPriority: import('./common').SyncPriority;
  /** 默认冲突解决策略 */
  defaultConflictResolution: import('./common').ConflictResolution;
  /** 同步间隔（毫秒） */
  syncInterval?: number;
  /** 最大同步重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 批量同步大小 */
  batchSize?: number;
  /** 删除后保留（毫秒），控制删除标记的数据在本地保留多久 */
  retentionAfterDelete?: number;
}

export interface SyncableEntity {
  /** 同步元数据 */
  _sync?: SyncMetadata;
}

// =================== 数据库错误类型与工厂 ===================

export interface DatabaseError extends Error {
  code: DatabaseErrorCode | string;
  details?: any;
}

export function createDatabaseError(
  code: DatabaseErrorCode | string,
  message: string,
  details?: any
): DatabaseError {
  const error = new Error(message) as DatabaseError;
  error.name = 'DatabaseError';
  error.code = code;
  if (details) error.details = details;
  return error;
}


export interface AppError {
  code: string; // 错误码
  type: 'network' | 'permission' | 'validation' | 'server' | 'unknown';
  message: string;
  cause?: any;
}

export interface AsyncState<T, E = AppError> {
  loading: boolean;
  error?: E;
  empty: boolean;
  data?: T;
}

export interface BatchResult<T> {
  success: boolean;
  results: T[];
  errors?: AppError[];
}
export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
} 


