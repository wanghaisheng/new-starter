import { BaseEntity } from './index';
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

// 数据库错误类型
export interface DatabaseError extends Error {
  code: string;
  details?: any;
}

// 查询选项接口
export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: string | string[];
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

// 数据库统计信息接口
export interface DatabaseStats {
  totalRecords: number;
  totalSize: number;
  lastSyncTime?: Date;
  lastError?: DatabaseError;
}

// 数据库操作结果接口
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

// 数据库事件处理器
export type DatabaseEventHandler = (event: DatabaseEvent, data?: any) => void;

export interface BatchOperation<T> {
  type: 'add' | 'put' | 'delete';
  data: T;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface DatabaseMetrics {
  queryCount: number;
  queryTime: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests?: string[];
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageStats {
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
}

export interface DatabaseClient {
  db: SQLiteDBConnection;
  config: DatabaseConfig;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  findById<T>(table: string, id: string): Promise<T | null>;
  findAll<T>(table: string): Promise<T[]>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  clear(): Promise<void>;
  initialize(): Promise<void>;
} 