import { BaseEntity } from './index';

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
  engine: DatabaseEngine;
  sync?: {
    enabled: boolean;
    strategy: SyncStrategy;
    interval?: number; // in milliseconds
    retryAttempts?: number;
    retryDelay?: number; // in milliseconds
    conflictResolution?: 'client-wins' | 'server-wins' | 'last-write-wins';
  };
  offline?: {
    maxStorageSize?: number; // in bytes
    maxEntitiesPerTable?: number;
    compressionEnabled?: boolean;
    encryptionEnabled?: boolean;
  };
}

// 数据库版本接口
export interface DatabaseVersion {
  version: number;
  statements: string[];
}

// 数据库错误类型
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
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
  totalSize: number;
  tableCount: number;
  recordCount: number;
  lastBackup?: Date;
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