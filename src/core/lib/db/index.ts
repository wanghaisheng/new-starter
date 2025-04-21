// 导出接口
export * from './types';
export * from './interfaces';

// 类型定义与注册表
export type {
  DatabaseType,
  TableSchema,
  ColumnDefinition,
  IndexDefinition,
  ISchemaRegistry,
  DatabaseVersion
} from './schema';

// 数据库表工厂与类型
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
} from './schema';

// 版本管理
export { databaseVersions, VersionManager } from './schema';

// 表转换器
export { TableConverter } from './schema';

// 单例实例
export const schemaRegistryInstance = require('./schema').schemaRegistryInstance;
export const versionManager = require('./schema').versionManager;

// 初始化与工具
export { initializeSchemas } from './schema';


// 导出所有仓储（自动聚合 repositories 目录下所有仓储）
export * from './repositories';

// 导出表结构
export { schemaRegistry } from './schema/index';
export { drizzleSchema, migrationSQL } from './schema/drizzle-schema';
