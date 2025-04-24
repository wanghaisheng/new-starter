console.log(' loaded');
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DatabaseError, DatabaseErrorCode } from './database-error';

// --- 以下类型迁移自 schema/types.ts ---

/**
 * 列类型枚举
 */
export enum ColumnType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TEXT = 'text',
  JSON = 'json',
  BLOB = 'blob'
}

/**
 * 列定义接口
 */
export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  nullable?: boolean;
  notNull?: boolean;
  defValue?: any;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

/**
 * 索引定义接口
 */
export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

/**
 * 表结构接口
 */
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  syncConfig?: any; // 保持兼容性，原为 SyncConfig
}

/**
 * 表结构注册表接口
 */
export interface ISchemaRegistry {
  register(schema: TableSchema): void;
  getSchema(name: string): TableSchema | undefined;
  getAllSchemas(): TableSchema[];
  hasSchema(name: string): boolean;
  removeSchema(name: string): void;
}

// --- 以上为迁移内容 ---



// 更新后的数据库引擎枚举值，参考数据服务设计文档
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

export type SyncStrategy = 'auto' | 'immediate' | 'periodic' | 'manual';

export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface SyncConfig {
  enabled: boolean;
  strategy: SyncStrategy;
  offlineOnly?: boolean;
  interval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
  localClient?: any;
  remoteClient?: any;
  syncIntervalMs?: number;
  maxSyncRetries?: number;
}

// ---- 存储后端配置 ----
export interface StorageConfig {
  online?: OnlineStorageConfig;
  offline?: OfflineStorageConfig;
  hybrid?: HybridStorageConfig;
}

export interface OnlineStorageConfig {
  type: 'supabase' | 'firebase' | 'rest' | 'custom';
  url?: string;
  apiKey?: string;
  projectId?: string;
  // 其它云端连接参数
}

export interface OfflineStorageConfig {
  type: 'indexeddb' | 'capacitor-sqlite' | 'mock' | 'localstorage'|'sqlite';
  path?: string;
  dbName?: string;
  mockMode?: boolean;
  // IndexedDB 专属字段
  cacheTimeout?: number;
  enableQueryCache?: boolean;
  enableEntityCache?: boolean;
}

export interface HybridStorageConfig {
  strategies: Array<'online-first' | 'offline-first' | 'manual-sync'>;
  fallback: 'offline' | 'online';
}

// ---- DatabaseConfig 顶层结构 ----
export interface DatabaseConfig {
  name: string;
  version: number;
  engine: DatabaseEngine;
  tables: Record<string, TableConfig>;
  env: EnvironmentConfig;
  storage: StorageConfig;
  sync?: SyncConfig;
  quizData?: QuizDataConfig;
  encryptionKey?: string;
  path?: string;
  schemas?: TableSchema[];
  sqliteConnection?: SQLiteDBConnection;
}

// 只保留 re-export，不再定义 DatabaseError/DatabaseErrorCode
export type { DatabaseError, DatabaseErrorCode };

// 查询操作符枚举值保持不变，如需扩展可参考文档
export type QueryOperator =
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
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface SyncState {
  status: SyncStatus;
  lastSync?: Date;
  error?: Error;
  progress?: number;
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

export type DatabaseEvent =
  | 'initialized'
  | 'closed'
  | 'error'
  | 'upgrade'
  | 'downgrade'
  | 'migrating'
  | 'migrated';

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

export interface DatabaseMetrics {
  queryCount: number;
  queryTime: number;
}

export type SortDirection = 'asc' | 'desc';

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

export type DatabaseEnvironment = 'mock' | 'local' | 'development' | 'production'|'test';

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

export type OnlineStorageType = typeof SUPPORTED_ONLINE_STORAGE_TYPES[number];
export type OfflineStorageType = typeof SUPPORTED_OFFLINE_STORAGE_TYPES[number];

export type DemoDataSource = 'local' | 'remote' | 'example';
export interface DatabaseConnection {
  host?: string;
  port?: number;
}

export interface QuizDataConfig {
  loadOnStartup: boolean;
  source: DemoDataSource;
}

export interface EnvironmentConfig {
  environment: DatabaseEnvironment;
  enableOffline: boolean;
  enableHybrid: boolean;
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
  engine: 'memory',
  tables: {},
  env: {
    environment: 'development',
    enableOffline: true,
    enableHybrid: false,
  },
  storage: {
    offline: {
      type: 'indexeddb',
      dbName: 'app_database',
      mockMode: true,
    },
    online: {
      type: 'supabase',
      url: '',
      apiKey: '',
    },
    hybrid: {
      strategies: ['offline-first'],
      fallback: 'offline',
    },
  },
  sync: {
    enabled: false,
    strategy: 'manual',
    conflictResolution: 'server-wins',
    syncIntervalMs: 60000,
    maxSyncRetries: 3,
    retryDelay: 2000,
  },
  quizData: {
    loadOnStartup: false,
    source: 'local',
  },
  encryptionKey: '',
  path: '',
  schemas: [],
  sqliteConnection: undefined,
};

export type { BaseEntity } from './base-entity';

export interface BatchOperation<T = any> {
  type: 'add' | 'put' | 'update' | 'delete';
  data: T;
  id?: string; // update/delete 操作时必需
}

export interface QueryResult<T> {
  items: T[];
  total?: number; // 可选，支持分页/统计
  [key: string]: any; // 扩展字段
}

// 数据库存储统计信息类型
export interface StorageStats {
  totalSize: number;        // 总存储空间（字节）
  availableSpace: number;   // 剩余可用空间（字节）
  usedSpace: number;        // 已用空间（字节）
}