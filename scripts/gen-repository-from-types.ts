// 自动从实体类型生成仓储接口和适配器实现脚本雏形
// 用法：npx tsx scripts/gen-repository-from-types.ts User

import { Project, InterfaceDeclaration, PropertySignature } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

const TYPE_DIR = path.resolve(__dirname, '../src/core/lib/db/types');
const REPO_TYPES_DIR = path.resolve(__dirname, '../src/core/lib/db/repositories/types');
const REPO_ADAPTERS_DIR = path.resolve(__dirname, '../src/core/lib/db/repositories/adapters');

function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getEntityTypeFile(entity: string) {
  return path.join(TYPE_DIR, `${entity.toLowerCase()}.types.ts`);
}

function getUniqueFields(properties: PropertySignature[]) {
  // 简单实现：email/phone/xxxId 自动识别为唯一索引
  return properties
    .filter(p => /email|phone|\w+Id$/i.test(p.getName()))
    .map(p => p.getName());
}

function genRepositoryInterface(entity: string, properties: PropertySignature[]): string {
  const uniqueFields = getUniqueFields(properties);
  return `import { ${entity} } from '@/core/lib/db/types/${entity.toLowerCase()}.types';\nimport { IBaseRepository } from './base-repository.types';\n\nexport interface I${entity}Repository extends IBaseRepository<${entity}> {\n${uniqueFields
    .map(f => `  findBy${upperFirst(f)}(${f}: string): Promise<${entity} | null>;`)
    .join('\n')}\n}\n`;
}

function genRepositoryAdapter(entity: string, uniqueFields: string[], adapter: 'IndexedDB' | 'SQLite'): string {
  const base = adapter === 'IndexedDB' ? 'BaseIndexedDBRepository' : 'BaseSQLiteRepository';
  const clientType = adapter === 'IndexedDB' ? `IndexedDBClient<${entity}>` : `SQLiteClient<${entity}>`;
  return `import { I${entity}Repository } from '../types/${entity.toLowerCase()}-repository.types';\nimport { ${entity} } from '@/core/lib/db/types/${entity.toLowerCase()}.types';\nimport { ${clientType} } from '@/core/lib/db/clients/${adapter.toLowerCase()}/${adapter.toLowerCase()}-client';\nimport { ${base} } from './${base.replace('Base', 'base-').toLowerCase()}';\n\nexport class ${entity}Repository${adapter} extends ${base}<${entity}> implements I${entity}Repository {\n  constructor(client: ${clientType}) {\n    super(client, '${entity.toLowerCase()}s');\n  }\n\n${uniqueFields
    .map(f => `  async findBy${upperFirst(f)}(${f}: string): Promise<${entity} | null> {\n    const results = await this.client.query(this.table, { where: { ${f} } });\n    return results.items[0] || null;\n  }`)
    .join('\n\n')}\n}\n`;
}

function main() {
  const entity = process.argv[2];
  if (!entity) throw new Error('请指定实体名，如 User');

  // 仅允许生成 Photo 类型（测试用）
  if (entity !== 'Photo') {
    console.log('当前仅支持 Photo 类型的仓储生成（测试脚本用）');
    return;
  }

  const project = new Project();
  const file = getEntityTypeFile(entity);
  const source = project.addSourceFileAtPath(file);
  const mainInterface = source.getInterfaces().find(intf => intf.getName() === entity);
  if (!mainInterface) throw new Error(`未找到实体 interface: ${entity}`);
  const properties = mainInterface.getProperties();

  // 生成接口
  const interfaceContent = genRepositoryInterface(entity, properties);
  fs.writeFileSync(path.join(REPO_TYPES_DIR, `${entity.toLowerCase()}-repository.types.ts`), interfaceContent);

  // 生成 IndexedDB 适配器
  const uniqueFields = getUniqueFields(properties);
  const indexeddbContent = genRepositoryAdapter(entity, uniqueFields, 'IndexedDB');
  fs.writeFileSync(path.join(REPO_ADAPTERS_DIR, `${entity.toLowerCase()}-repository-indexeddb.ts`), indexeddbContent);

  // 生成 SQLite 适配器
  const sqliteContent = genRepositoryAdapter(entity, uniqueFields, 'SQLite');
  fs.writeFileSync(path.join(REPO_ADAPTERS_DIR, `${entity.toLowerCase()}-repository-sqlite.ts`), sqliteContent);

  console.log(`已生成 ${entity} 仓储接口和适配器实现`);
}

main();
