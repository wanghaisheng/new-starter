import { DrizzleSchemaAdapter } from './adapters/drizzle-adapter';

import { schemaRegistry } from './index';

// 导入所有表结构定义
import './definitions/user-schema';
import './definitions/match-schema';
import './definitions/message-schema';

// 获取所有表结构
const schemas = schemaRegistry.getAllSchemas();

// 转换为 Drizzle 表结构
export const users = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('users')!
);

export const matches = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('matches')!
);

export const messages = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('messages')!
);

// 导出所有表结构
export const drizzleSchema = {
  users,
  matches,
  messages
};

// 生成迁移 SQL
export const migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);