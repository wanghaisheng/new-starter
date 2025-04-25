import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

// import { TableSchema, ColumnDefinition } from '@/core/lib/db/schema/index';
import {ColumnType} from '../../types/common'
import { TableSchema, ColumnDefinition } from '../../types/database';

/**
 * Drizzle ORM 适配器
 * 用于将通用表结构定义转换为 Drizzle ORM 的表结构
 */
export class DrizzleSchemaAdapter {
  /**
   * 将通用表结构转换为 Drizzle 表结构
   * @param schema 通用表结构
   * @returns Drizzle 表结构
   */
  static convertToSqliteTable(schema: TableSchema): any {
    const columns: Record<string, any> = {};
    
    // 转换列定义
    schema.columns.forEach(column => {
      columns[column.name] = this.convertSqliteColumn(column);
    });
    
    // 创建表
    return sqliteTable(schema.name, columns);
  }
  
  /**
   * 将通用列定义转换为 Drizzle SQLite 列定义
   * @param column 通用列定义
   * @returns Drizzle 列定义
   */
  private static convertSqliteColumn(column: ColumnDefinition): any {
    let columnDef;
    
    // 根据类型创建列
    switch (column.type.toLowerCase()) {
      case 'string':
      case 'text':
        columnDef = text(column.name);
        break;
      case 'integer':
      case 'number':
        columnDef = integer(column.name);
        break;
      case 'boolean':
        columnDef = integer(column.name, { mode: 'boolean' });
        break;
      case 'date':
        // 使用 text 类型存储日期，不使用 transform
        columnDef = text(column.name);
        break;
      case 'json':
      case 'array':
        // 使用 text 类型存储 JSON，不使用 transform
        columnDef = text(column.name);
        break;
      case 'blob':
        columnDef = blob(column.name);
        break;
      default:
        columnDef = text(column.name);
    }
    
    // 应用约束
    if (column.primaryKey) {
      columnDef = columnDef.primaryKey();
    }
    
    if (column.notNull) {
      columnDef = columnDef.notNull();
    }
    
    if (column.unique) {
      columnDef = columnDef.unique();
    }
    
    if (column.defValue !== undefined) {
      if (typeof column.defValue === 'function') {
        columnDef = columnDef.default(sql`${column.defValue()}`);
      } else {
        columnDef = columnDef.default(column.defValue);
      }
    }
    
    return columnDef;
  }
  
  /**
   * 生成迁移 SQL
   * @param schemas 表结构列表
   * @returns 迁移 SQL 语句
   */
  static generateMigrationSQL(schemas: TableSchema[]): string[] {
    const sqls: string[] = [];
    schemas.forEach(schema => {
      // 对表名和索引名做转义，防止连字符等特殊字符导致 SQL 错误
      const quoteIdentifier = (name: string): string => {
        // 若表名含有特殊字符（如连字符），加双引号
        return /[^a-zA-Z0-9_]/.test(name) ? `"${name}"` : name;
      }
      const tableName = quoteIdentifier(schema.name);
      let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
`;
      // 列定义
      const columnDefs = schema.columns.map(column => {
        let def = `  ${quoteIdentifier(column.name)} ${this.getSQLiteType(column.type)}`;
        if (column.primaryKey) {
          def += ' PRIMARY KEY';
        }
        if (column.notNull) {
          def += ' NOT NULL';
        }
        if (column.unique) {
          def += ' UNIQUE';
        }
        if (column.defValue !== undefined) {
          def += ` DEFAULT ${this.formatDefaultValue(column.defValue)}`;
        }
        if (column.references) {
          def += ` REFERENCES ${quoteIdentifier(column.references.table)}(${quoteIdentifier(column.references.column)})`;
        }
        return def;
      });
      sql += columnDefs.join('\n,');
      sql += '\n);';
      sqls.push(sql);
      // 生成索引 SQL
      if (schema.indexes && schema.indexes.length > 0) {
        for (const index of schema.indexes) {
          const indexName = quoteIdentifier(index.name);
          const indexTable = tableName;
          const unique = index.unique ? 'UNIQUE ' : '';
          sqls.push(`CREATE ${unique}INDEX IF NOT EXISTS ${indexName} ON ${indexTable} (${index.columns.map(quoteIdentifier).join(', ')});`);
        }
      }
    });
    return sqls;
  }
  
  /**
   * 获取 SQLite 类型
   * @param type 通用类型
   * @returns SQLite 类型
   */
  private static getSQLiteType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
      case 'text':
        return 'TEXT';
      case 'integer':
      case 'number':
      case 'boolean':
        return 'INTEGER';
      case 'real':
      case 'float':
      case 'double':
        return 'REAL';
      case 'blob':
        return 'BLOB';
      case 'date':
      case 'json':
      case 'array':
        return 'TEXT';
      default:
        return 'TEXT';
    }
  }
  
  /**
   * 格式化默认值
   * @param value 默认值
   * @returns 格式化后的默认值
   */
  private static formatDefaultValue(value: any): string {
    if (value === null) {
      return 'NULL';
    }
    
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    if (typeof value === 'function') {
      return 'CURRENT_TIMESTAMP';
    }
    
    return String(value);
  }
}