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