import { mysqlTable } from 'drizzle-orm/mysql-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

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
      
      if (column.defValue !== undefined) {
        if (typeof column.defValue === 'function') {
          columnDefs[column.name] = columnDefs[column.name].default(sql`${column.defValue()}`);
        } else {
          columnDefs[column.name] = columnDefs[column.name].default(column.defValue);
        }
      }
    });
  
    // 根据不同数据库类型返回对应的表定义
    switch (dbType) {
      case 'sqlite':
        return sqliteTable(schema.name, columnDefs);
      case 'postgres':
        return pgTable(schema.name, columnDefs);
      case 'mock':
        return {
          name: schema.name,
          fields: columnDefs,
        };
      case 'indexeddb':
        return {
          storeName: schema.name,
          keyPath: 'id',
          indexes: schema.indexes || [],
        };
      case 'cloudflare-d1':
        return {
          ...sqliteTable(schema.name, columnDefs),
          d1Specific: {
            durability: 'relaxed',
            edgeCache: true
          }
        };
      case 'firebase':
        return {
          name: schema.name,
          fields: columnDefs,
        };
      case 'supabase':
        return pgTable(schema.name, columnDefs);
      case 'turso':
        return sqliteTable(schema.name, columnDefs);
      case 'tidb':
        return mysqlTable(schema.name, columnDefs);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
} 