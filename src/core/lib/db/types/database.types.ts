import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { BaseEntity } from './base-entity';
import { TableSchema } from '../schema/index';

// 更新后的数据库引擎枚举值，参考数据服务设计文档
export type DatabaseEngine =
  | 'mock'
  | 'mock-indexeddb'
  | 'indexeddb'
  | 'sqlite'
  | 'fake-indexeddb'
  | 'capacitor-sqlite'
  | 'supabase'
  | 'cloudflare-d1'
  | 'firebase'
  | 'turso'
  | 'tidb'
  | 'postgres'
  | 'hybrid';

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

export interface HybridDatabaseConfig {
  engine: DatabaseEngine;
  schemas: TableSchema[];
  sqliteConnection?: SQLiteDBConnection;
  sync?: SyncConfig;
}

export interface DatabaseConfig extends HybridDatabaseConfig {
  name: string;
  version: number;
  encryptionKey?: string;
}

export interface DatabaseVersion {
  version: number;
  statements: string[];
}

export interface DatabaseError extends Error {
  code: string;
  details?: any;
}

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

export type DatabaseEnvironment = 'mock' | 'local' | 'development' | 'production';

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

export type DemoDataSource = 'example' | 'dating';

export interface DatabaseConnection {
  host?: string;
  port?: number;
}

export interface OnlineStorageConfig {
  type: OnlineStorageType;
  connection: DatabaseConnection;
}

export interface OfflineStorageConfig {
  type: OfflineStorageType;
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
    online: OnlineStorageConfig;
    offline: OfflineStorageConfig;
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
  schemas: [],
  tables: {},
  env: {
    environment: 'development',
    enableOffline: false,
    enableHybrid: false,
  },
  storage: {
    online: {
      type: 'memory',
      connection: {},
    },
    offline: {
      type: 'indexeddb',
      connection: {},
    },
  },
  sync: {
    enabled: false,
    strategy: 'auto',
    conflictResolution: 'server-wins',
    syncIntervalMs: 0,
  },
  testData: {
    loadOnStartup: false,
    source: 'example',
  },
};

export type { BaseEntity } from './base-entity';

export interface BatchOperation<T = any> {
  type: 'add' | 'put' | 'delete';
  data: T;
}
