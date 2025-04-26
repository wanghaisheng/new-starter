// 自动从 src/core/lib/db/schema/definitions 下所有 TableSchema 类型定义，批量生成 SQLite 建表 DDL SQL 文件
import { promises as fs } from 'fs';
import path from 'path';
import { DrizzleSchemaAdapter } from '../src/core/lib/db/schema/adapters/drizzle-adapter';
import { schemaRegistry } from '../src/core/lib/db/schema/index';

const SCHEMA_DIR = path.resolve(__dirname, '../src/core/lib/db/schema/definitions');
const OUTPUT_DIR = path.resolve(__dirname, '../migrations/generated');

async function loadAllSchemas() {
  // 只需 require 一遍 definitions 目录下所有文件，schemaRegistry 就会自动注册所有表
  const files = await fs.readdir(SCHEMA_DIR);
  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      await import(path.join(SCHEMA_DIR, file));
    }
  }
  // 获取所有注册的 schema
  return schemaRegistry.getAllSchemas ? schemaRegistry.getAllSchemas() : Array.from(schemaRegistry.schemas.values());
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const schemas = await loadAllSchemas();
  const ddls = DrizzleSchemaAdapter.generateMigrationSQL(schemas);
  for (let i = 0; i < schemas.length; i++) {
    const name = schemas[i].name;
    const ddl = ddls[i];
    await fs.writeFile(path.join(OUTPUT_DIR, `${name}.sql`), ddl, 'utf8');
    console.log(`Generated: ${name}.sql`);
  }
  console.log('All DDL generated!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
