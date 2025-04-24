import { DrizzleSchemaAdapter } from './adapters/drizzle-adapter';
import { schemaRegistry } from './index';

// 不再自动注册核心 schema，交由主程序/测试用例分别注册

// 获取所有已注册表结构
const schemas = schemaRegistry.getAllSchemas();

// 动态转换所有表结构为 drizzle 表对象
export const drizzleSchema: Record<string, any> = {};
for (const schema of schemas) {
  drizzleSchema[schema.name] = DrizzleSchemaAdapter.convertToSqliteTable(schema);
}

// 生成迁移 SQL
export const migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);