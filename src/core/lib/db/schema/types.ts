// 表结构接口
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

// 列定义接口
export interface ColumnDefinition {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: any;
  references?: {
    table: string;
    column: string;
  };
}

// 索引定义接口
export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

// 表结构注册表接口
export interface ISchemaRegistry {
  register(schema: TableSchema): void;
  getSchema(name: string): TableSchema | undefined;
  getAllSchemas(): TableSchema[];
  hasSchema(name: string): boolean;
  removeSchema(name: string): void;
  clear(): void;
}

export type DatabaseType = 
  | 'sqlite'
  | 'postgres'
  | 'mysql'
  | 'mariadb'
  | 'planetscale'
  | 'neon'
  | 'turso'
  | 'firebase'
  | 'supabase'
  | 'mongodb'
  | 'dynamodb'
  | 'indexeddb'
  | 'tidb'
  | 'cloudflare_d1'; 