// 用于从 src/core/lib/db 下的 drizzle schema 类型定义生成 SQLite/MySQL 等建表 DDL SQL 文件
import { promises as fs } from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/sqlite'; // 你可根据实际 db 类型替换
// 假设所有 schema 定义都统一导出

const SCHEMA_DIR = path.resolve(__dirname, '../src/core/lib/db');
const OUTPUT_DIR = path.resolve(__dirname, '../migrations/generated');

async function loadAllSchemas() {
  const files = await fs.readdir(SCHEMA_DIR);
  const schemas = [];
  for (const file of files) {
    if (file.endsWith('-schema.ts')) {
      const schemaModule = await import(path.join(SCHEMA_DIR, file));
      // 约定：每个 schema 文件导出 default 或名为 schema/table 的对象
      const exported = schemaModule.default || schemaModule.schema || schemaModule.table;
      if (exported) schemas.push({ name: file.replace(/\.ts$/, ''), schema: exported });
    }
  }
  return schemas;
}

function wrapTableName(name: string) {
  // 兼容表名含特殊字符（如连字符）
  if (/[^a-zA-Z0-9_]/.test(name)) {
    return `"${name}"`;
  }
  return name;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const schemas = await loadAllSchemas();
  for (const { name, schema } of schemas) {
    // 假设 drizzle 提供 getCreateTableSQL 方法（实际需用 drizzle 的 migration/sql 生成）
    // 这里只做伪代码演示
    let ddl = '';
    if (typeof schema.getCreateTableSQL === 'function') {
      ddl = schema.getCreateTableSQL();
    } else if (schema.sql) {
      ddl = schema.sql;
    } else {
      // 伪生成
      ddl = `CREATE TABLE ${wrapTableName(name)} (...);`;
    }
    // 修正表名带连字符等特殊字符
    ddl = ddl.replace(/CREATE TABLE ([^ (]+)/, (m, t) => `CREATE TABLE ${wrapTableName(t)}`);
    await fs.writeFile(path.join(OUTPUT_DIR, `${name}.sql`), ddl, 'utf8');
    console.log(`Generated: ${name}.sql`);
  }
  console.log('All DDL generated!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
