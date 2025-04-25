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



export type CreateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntityData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;



// =================== 通用数据库类型定义 ===================

// ---- 数据流向/环境 ----
export enum DataMode {
  OFFLINE = 'offline',
  ONLINE = 'online',
  HYBRID = 'hybrid'
}

// ---- 排序方向 ----
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

// ---- 在线存储类型 ----
export enum OnlineStorageType {
  SUPABASE = 'supabase',
  FIREBASE = 'firebase',
  TIDB = 'tidb',
  CUSTOM = 'custom'
}

// ---- 离线存储类型 ----
export enum OfflineStorageType {
  INDEXEDDB = 'indexeddb',
  CAPACITOR_SQLITE = 'capacitor-sqlite',
  MOCK = 'mock',
  LOCALSTORAGE = 'localstorage',
  SQLITE = 'sqlite'
}

// ---- 混合存储策略 ----
export enum HybridStrategy {
  ONLINE_FIRST = 'online-first',
  OFFLINE_FIRST = 'offline-first',
  MANUAL_SYNC = 'manual-sync'
}

// ---- 列定义与表结构 ----
// ColumnType 枚举已迁移至 common.ts，请从 '@/core/lib/db/types/common' 引用
import { ColumnType } from '@/core/lib/db/types/common';

export interface ColumnDefinition {
  name: string;
  type: ColumnType; // 从 common.ts 引用
  primaryKey?: boolean;
  nullable?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defValue?: any;
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
export enum QueryOperator {
  EQ = '==',
  LT = '<',
  LTE = '<=',
  GT = '>',
  GTE = '>=',
  NEQ = '!=',
  IN = '$in',
  NE = '$ne',
  CONTAINS = '$contains',
  GT_DOLLAR = '$gt',
  LT_DOLLAR = '$lt',
  GTE_DOLLAR = '$gte',
  LTE_DOLLAR = '$lte',
  AND = '$and',
  OR = '$or'
}

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

export enum DatabaseEvent {
  INITIALIZED = 'initialized',
  CLOSED = 'closed',
  ERROR = 'error',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  MIGRATING = 'migrating',
  MIGRATED = 'migrated'
}

export interface StorageConfig {
  online?: OnlineStorageConfig;
  offline?: OfflineStorageConfig;
  hybrid?: HybridStorageConfig;
}

export interface OnlineStorageConfig {
  type: OnlineStorageType;
  url?: string;
  apiKey?: string;
  projectId?: string;
}

export interface OfflineStorageConfig {
  type: OfflineStorageType;
  path?: string;
  dbName?: string;
  mockMode?: boolean;
  cacheTimeout?: number;
  enableQueryCache?: boolean;
  enableEntityCache?: boolean;
}

export interface HybridStorageConfig {
  strategies: HybridStrategy[];
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


export type DemoDataSource = 'local' | 'remote' | 'example';

export interface DatabaseConnection {
  host?: string;
  port?: number;
}

// ---- 数据库类型与引擎 ----
export enum DatabaseType {
  MOCK = 'mock',
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite',
  CLOUDFLARE_D1 = 'cloudflare-d1',
  FIREBASE = 'firebase',
  SUPABASE = 'supabase',
  TURSO = 'turso',
  TIDB = 'tidb',
  CAPACITOR_SQLITE = 'capacitor-sqlite',
  POSTGRES = 'postgres',
  HYBRID = 'hybrid'
}

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

export enum SyncState {
  /** 新建本地，未同步到远程 */
  NEW = 'new',
  /** 本地修改，未同步到远程 */
  MODIFIED = 'modified',
  /** 本地删除，未从远程删除 */
  DELETED = 'deleted',
  /** 已同步，本地和远程相同 */
  SYNCED = 'synced',
  /** 同步冲突，需要解决 */
  CONFLICT = 'conflict',
  /** 同步失败，需要重试 */
  FAILED = 'failed'
}

export enum SyncPriority {
  /** 高优先级，立即同步 */
  HIGH = 'high',
  /** 中等优先级，正常同步周期 */
  MEDIUM = 'medium',
  /** 低优先级，空闲时同步 */
  LOW = 'low',
  /** 手动同步，仅在用户请求时同步 */
  MANUAL = 'manual'
}

export enum ConflictResolution {
  /** 客户端优先，保留本地修改 */
  CLIENT_WINS = 'client_wins',
  /** 服务器优先，使用远程数据 */
  SERVER_WINS = 'server_wins',
  /** 合并修改，尝试合并数据 */
  MERGE = 'merge',
  /** 手动解决，提示用户选择 */
  MANUAL = 'manual'
}

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
  syncPriority: SyncPriority;
  /** 版本标识符（用于乐观锁） */
  version?: number | string;
  /** 冲突解决策略 */
  conflictResolution?: ConflictResolution;
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
  defaultPriority: SyncPriority;
  /** 默认冲突解决策略 */
  defaultConflictResolution: ConflictResolution;
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

export enum DatabaseErrorCode {
  UNKNOWN = 'UNKNOWN',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONSTRAINT_ERROR = 'CONSTRAINT_ERROR',
  TIMEOUT = 'TIMEOUT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  UNKNOWN_CLIENT = 'UNKNOWN_CLIENT',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  SYNC_ERROR = 'SYNC_ERROR',
  REMOTE_ERROR = 'REMOTE_ERROR',
  UPGRADE_IN_PROGRESS = 'UPGRADE_IN_PROGRESS',
  NO_UPGRADE_IN_PROGRESS = 'NO_UPGRADE_IN_PROGRESS',
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  NO_ACTIVE_TRANSACTION = 'NO_ACTIVE_TRANSACTION',
}

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