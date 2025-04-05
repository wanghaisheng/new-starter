import { SyncConfig } from '@/core/lib/db/types/sync-flags';

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
  defaultValue?: any;
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
  syncConfig?: SyncConfig;
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
  clear(): void;
}

// 数据库类型定义
export type DatabaseType = 
  | 'mock'
  | 'indexeddb'
  | 'sqlite'
  | 'cloudflare-d1'
  | 'firebase'
  | 'supabase'
  | 'turso'
  | 'tidb'
  | 'postgres'; 