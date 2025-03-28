import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
// Add imports for other database types
import { mysqlTable } from 'drizzle-orm/mysql-core';
// import { sqlServerTable } from 'drizzle-orm/sql-server-core';

export type DatabaseType = 'sqlite' | 'postgres' | 'firebase' | 'supabase' | 'mongodb' | 'dynamodb' | 'indexeddb' | 'tidb' | 'cloudflare_d1' | 'mysql' | 'mariadb' | 'sqlserver' | 'planetscale' | 'neon' | 'turso';

// 定义通用的表结构接口
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

// 定义通用的列定义接口
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

// 定义通用的索引定义接口
export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

// 创建表结构注册表
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas: Map<string, TableSchema> = new Map();

  private constructor() {}

  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  // 注册表结构
  public register(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
  }

  // 获取表结构
  public getSchema(name: string): TableSchema | undefined {
    return this.schemas.get(name);
  }

  // 获取所有表结构
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

   // 扩展数据库类型定义
  
  // 根据数据库类型获取对应的表定义
  public getTableDefinition(name: string, dbType: DatabaseType): any {
    const schema = this.getSchema(name);
    if (!schema) {
      throw new Error(`Schema not found: ${name}`);
    }
  
    // 将 ColumnDefinition[] 转换为 Drizzle 期望的列定义对象
    const columnDefs: Record<string, any> = {};
    
    schema.columns.forEach(column => {
      // 根据列类型创建对应的列定义
      switch (column.type.toLowerCase()) {
        case 'string':
        case 'text':
          columnDefs[column.name] = text(column.name);
          break;
        case 'integer':
        case 'number':
          columnDefs[column.name] = integer(column.name);
          break;
        // 可以根据需要添加更多类型
        default:
          columnDefs[column.name] = text(column.name);
      }
      
      // 应用约束
      if (column.primaryKey) {
        columnDefs[column.name] = columnDefs[column.name].primaryKey();
      }
      
      if (column.notNull) {
        columnDefs[column.name] = columnDefs[column.name].notNull();
      }
      
      if (column.unique) {
        columnDefs[column.name] = columnDefs[column.name].unique();
      }
      
      if (column.defaultValue !== undefined) {
        columnDefs[column.name] = columnDefs[column.name].default(column.defaultValue);
      }
    });
  
    // 根据不同数据库类型返回对应的表定义
    switch (dbType) {
      case 'sqlite':
        return sqliteTable(schema.name, columnDefs);
      case 'postgres':
        return pgTable(schema.name, columnDefs);
      case 'mysql':
      case 'mariadb':
        return mysqlTable(schema.name, columnDefs);
      // case 'sqlserver':
        // return sqlServerTable(schema.name, columnDefs);
      case 'planetscale':
        // PlanetScale is MySQL-compatible
        return mysqlTable(schema.name, columnDefs);
      case 'neon':
        // Neon is PostgreSQL-compatible
        return pgTable(schema.name, columnDefs);
      case 'turso':
        // Turso is SQLite-compatible
        return sqliteTable(schema.name, columnDefs);
      case 'firebase':
        // 返回 Firebase 格式的表定义
        return {
          name: schema.name,
          fields: columnDefs,
          // Firebase 特定配置
        };
      case 'supabase':
        // Supabase 使用 PostgreSQL，可以复用 pgTable
        return pgTable(schema.name, columnDefs);
      case 'mongodb':
        // 返回 MongoDB 格式的表定义
        return {
          collection: schema.name,
          fields: columnDefs,
          // MongoDB 特定配置
        };
      case 'dynamodb':
        // 返回 DynamoDB 格式的表定义
        return {
          tableName: schema.name,
          attributes: columnDefs,
          // DynamoDB 特定配置
        };
      case 'indexeddb':
        // 返回 IndexedDB 格式的表定义
        return {
          storeName: schema.name,
          keyPath: 'id', // 假设 id 是主键
          indexes: schema.indexes || [],
        };
      case 'tidb':
        // TiDB 兼容 MySQL，但也有自己的特性
        return {
          tableName: schema.name,
          fields: columnDefs,
          engine: 'TiDB', // TiDB 特定配置
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci'
        };
      case 'cloudflare_d1':
        // Cloudflare D1 基于 SQLite，可以复用 SQLite 表结构
        return {
          ...sqliteTable(schema.name, columnDefs),
          // Cloudflare D1 特定配置
          d1Specific: {
            durability: 'relaxed', // 示例配置
            edgeCache: true
          }
        };
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}

// 导出单例实例
export const schemaRegistry = SchemaRegistry.getInstance();