// 纯 JS 脚本：自动从 src/core/lib/db/schema/definitions 下所有 TableSchema 类型定义，批量生成 SQLite 建表 DDL SQL 文件
const fs = require('fs');
const path = require('path');
const { DrizzleSchemaAdapter } = require('../src/core/lib/db/schema/adapters/drizzle-adapter');
const { schemaRegistry } = require('../src/core/lib/db/schema/index');

const SCHEMA_DIR = path.resolve(__dirname, '../src/core/lib/db/schema/definitions');
const OUTPUT_DIR = path.resolve(__dirname, '../migrations/generated');

function loadAllSchemas() {
  const files = fs.readdirSync(SCHEMA_DIR);
  for (const file of files) {
    if (file.endsWith('.js')) {
      require(path.join(SCHEMA_DIR, file));
    }
  }
  // 获取所有注册的 schema
  return schemaRegistry.getAllSchemas ? schemaRegistry.getAllSchemas() : Array.from(schemaRegistry.schemas.values());
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const schemas = loadAllSchemas();
  const ddls = DrizzleSchemaAdapter.generateMigrationSQL(schemas);
  for (let i = 0; i < schemas.length; i++) {
    const name = schemas[i].name;
    const ddl = ddls[i];
    fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.sql`), ddl, 'utf8');
    console.log(`Generated: ${name}.sql`);
  }
  console.log('All DDL generated!');
}

main();
