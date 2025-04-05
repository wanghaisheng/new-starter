import { mysqlTable } from 'drizzle-orm/mysql-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { DatabaseType, TableSchema } from './types';

export class TableConverter {
  /**
   * 将通用表结构转换为特定数据库的表定义
   */
  public static convertToTableDefinition(schema: TableSchema, dbType: DatabaseType): any {
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
        case 'uuid':
          columnDefs[column.name] = uuid(column.name);
          break;
        case 'timestamp':
          columnDefs[column.name] = timestamp(column.name);
          break;
        case 'json':
          columnDefs[column.name] = jsonb(column.name);
          break;
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