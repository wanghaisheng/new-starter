import { mysqlTable } from 'drizzle-orm/mysql-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { DatabaseVersion } from '@/core/lib/db/types/database.types';

import { registerCoreSchemas } from './core-schemas';
import { registerOfflineSchemas } from './offline-schemas';
import { SchemaRegistry } from './schema-registry';
import { TableConverter } from './table-converter';
import { DatabaseType, TableSchema, ColumnDefinition, IndexDefinition, ISchemaRegistry } from './types';
import { VersionManager } from './version-manager';
import { databaseVersions } from './versions';

// 导出类型定义
export type {
  DatabaseType,
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  ISchemaRegistry,
  DatabaseVersion
};

// 导出数据库类型
export {
  sqliteTable,
  pgTable,
  mysqlTable,
  text,
  integer,
  uuid,
  varchar,
  timestamp,
  jsonb
};

// 导出版本管理
export { databaseVersions };
export { VersionManager };

// 导出表转换器
export { TableConverter };

// 创建单例实例
export const schemaRegistry = SchemaRegistry.getInstance();
export const versionManager = VersionManager.getInstance();

// 注：先创建和导出schemaRegistry，然后才导入模式文件
// 这样可以确保schema registry已初始化

// 导入所有表结构定义（但不立即注册）
// 其他模式定义导入
// import './definitions/user-schema';
// import './definitions/message-schema';

/**
 * 初始化所有模式
 * 确保所有表结构都已注册
 */
export function initializeSchemas(): void {
  // 现在显式注册所有模式
  registerOfflineSchemas();
  
  // 注册核心应用模式（用户、匹配、消息等）
  registerCoreSchemas();
  
  // 可以在这里调用其他模式的注册函数
  // registerUserSchemas();
  // registerMessageSchemas();
  
  console.log(`已注册 ${schemaRegistry.getAllSchemas().length} 个表结构`);
}

/**
 * 获取所有注册的表名
 */
export function getAllTableNames(): string[] {
  return schemaRegistry.getAllSchemas().map(schema => schema.name);
}

/**
 * 获取所有离线专用表名
 */
export function getOfflineOnlyTableNames(): string[] {
  return schemaRegistry.getAllSchemas()
    .filter(schema => schema.syncConfig?.offlineOnly === true)
    .map(schema => schema.name);
}

/**
 * 数据库架构注册表
 * 
 * 这个文件定义了应用的数据模型架构注册机制，
 * 它集中管理所有实体的架构定义，提供统一的访问接口。
 */

/**
 * 列定义接口
 */
export interface SchemaColumn {
  /**
   * 列名
   */
  name: string;
  
  /**
   * 列类型，例如 'string', 'number', 'boolean', 'date', 'json' 等
   */
  type: string;
  
  /**
   * 是否为主键
   */
  primaryKey?: boolean;
  
  /**
   * 是否不允许为空
   */
  notNull?: boolean;
  
  /**
   * 默认值
   */
  defaultValue?: any;
  
  /**
   * 列注释
   */
  comment?: string;
}

/**
 * 索引定义接口
 */
export interface SchemaIndex {
  /**
   * 索引名称，如果不提供，将自动生成
   */
  name?: string;
  
  /**
   * 索引包含的列名数组
   */
  columns: string[];
  
  /**
   * 是否为唯一索引
   */
  unique?: boolean;
}

/**
 * 架构定义接口
 */
export interface Schema {
  /**
   * 表名
   */
  name: string;
  
  /**
   * 列定义数组
   */
  columns: SchemaColumn[];
  
  /**
   * 索引定义数组
   */
  indexes?: SchemaIndex[];
  
  /**
   * 表注释
   */
  comment?: string;
}

// 存储所有注册的架构
const schemas: Schema[] = [];

/**
 * 架构注册表，用于管理数据库架构定义
 */
export const schemaRegistry = {
  /**
   * 注册一个新的架构
   * 
   * @param schema 架构定义
   */
  register: (schema: Schema) => {
    // 检查是否已存在同名架构
    const existingIndex = schemas.findIndex(s => s.name === schema.name);
    if (existingIndex >= 0) {
      // 更新现有架构
      schemas[existingIndex] = schema;
      console.log(`更新架构: ${schema.name}`);
    } else {
      // 添加新架构
      schemas.push(schema);
      console.log(`注册新架构: ${schema.name}`);
    }
  },
  
  /**
   * 获取指定名称的架构
   * 
   * @param name 架构名称
   * @returns 架构定义或 undefined（如果不存在）
   */
  getSchema: (name: string): Schema | undefined => {
    return schemas.find(s => s.name === name);
  },
  
  /**
   * 获取所有注册的架构
   * 
   * @returns 架构定义数组
   */
  getAllSchemas: (): Schema[] => {
    return [...schemas];
  },
  
  /**
   * 删除一个架构
   * 
   * @param name 架构名称
   * @returns 是否成功删除
   */
  removeSchema: (name: string): boolean => {
    const initialLength = schemas.length;
    const newSchemas = schemas.filter(s => s.name !== name);
    schemas.length = 0;
    schemas.push(...newSchemas);
    return schemas.length < initialLength;
  },
  
  /**
   * 清空所有架构
   */
  clearAll: () => {
    schemas.length = 0;
    console.log('所有架构已清空');
  }
};

// 导入和注册各个实体的架构
// TODO: 当实体架构文件创建后，在此处导入并注册它们
// import { userSchema } from './user.schema';
// import { messageSchema } from './message.schema';
// 
// // 注册架构
// schemaRegistry.register(userSchema);
// schemaRegistry.register(messageSchema);

export default schemaRegistry;