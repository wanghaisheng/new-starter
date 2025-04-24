console.log('schema/index loaded');
console.log('schema/index loaded');

import { mysqlTable } from 'drizzle-orm/mysql-core';
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// import { DatabaseVersion } from '@/core/lib/db/types/'; // 已无此导出，注释掉

import { registerCoreSchemas } from './core-schemas';
import { registerOfflineSchemas } from './offline-schemas';
import { schemaRegistry } from './schema-registry-singleton';
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
  ISchemaRegistry
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

// 单例实例导出
export { schemaRegistry };
export const versionManager = VersionManager.getInstance();

// 不再直接导入 schema definitions，避免循环依赖
// 由 initializeSchemas 或主入口统一注册

/**
 * 初始化所有模式
 * 确保所有表结构都已注册
 */
export function initializeSchemas(): void {
  registerOfflineSchemas();
  if (registerCoreSchemas.length === 1) {
    registerCoreSchemas();
  } else {
    registerCoreSchemas();
  }
  console.log(`已注册 ${schemaRegistry.getAllSchemas().length} 个表结构`);
}

export function getAllTableNames(): string[] {
  return schemaRegistry.getAllSchemas().map(schema => schema.name);
}

export function getOfflineOnlyTableNames(): string[] {
  return schemaRegistry.getAllSchemas()
    .filter(schema => (schema as any).syncConfig?.offlineOnly === true)
    .map(schema => schema.name);
}