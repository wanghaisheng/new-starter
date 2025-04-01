import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { mysqlTable } from 'drizzle-orm/mysql-core';
import { SchemaRegistry } from './schema-registry';
import { VersionManager } from './version-manager';
import { TableConverter } from './table-converter';
import { databaseVersions } from './versions';
import { DatabaseType, TableSchema, ColumnDefinition, IndexDefinition, ISchemaRegistry } from './types';
import { DatabaseVersion } from '../types/database.types';

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
import { registerOfflineSchemas } from './offline-schemas';
import { registerCoreSchemas } from './core-schemas';
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