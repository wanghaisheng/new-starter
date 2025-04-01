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

// 导出单例实例
export const schemaRegistry = SchemaRegistry.getInstance();
export const versionManager = VersionManager.getInstance();

// 导入并注册所有表结构
// 这里只需导入，各个模式文件会自行注册
import './offline-schemas';
// 注：这里可以导入其他模式定义文件
// import './definitions/user-schema';
// import './definitions/match-schema';
// import './definitions/message-schema';

/**
 * 初始化所有模式
 * 确保所有表结构都已注册
 */
export function initializeSchemas(): void {
  // 可以在这里进行其他初始化操作
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