// 升级版：自动主键/索引识别、多 interface 支持、字段注释同步、支持更新已有 schema 文件
// 使用：npx ts-node scripts/gen-schema-from-types.ts

import { Project, InterfaceDeclaration, PropertySignature, Type } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

const TYPE_DIR = path.resolve(__dirname, '../src/core/lib/db/types');
const SCHEMA_DIR = path.resolve(__dirname, '../src/core/lib/db/schema/definitions');

// 类型到 ColumnType 的映射
const typeMap: Record<string, string> = {
  string: 'ColumnType.STRING',
  number: 'ColumnType.NUMBER',
  boolean: 'ColumnType.BOOLEAN',
  Date: 'ColumnType.DATETIME',
  'Record<string, any>': 'ColumnType.JSON',
  object: 'ColumnType.JSON',
};

function tsTypeToColumnType(type: Type, name: string): string {
  if (type.isString()) return 'ColumnType.STRING';
  if (type.isNumber()) return 'ColumnType.NUMBER';
  if (type.isBoolean()) return 'ColumnType.BOOLEAN';
  if (type.isEnum() || type.isUnion() && type.getUnionTypes().every((t: Type) => t.isStringLiteral())) return 'ColumnType.STRING';
  if (type.isArray() || type.isTuple() || type.getText().endsWith('[]')) return 'ColumnType.JSON';
  if (type.getText() === 'Date') return 'ColumnType.DATETIME';
  return 'ColumnType.JSON';
}

// 识别主键、唯一索引、普通索引
function analyzeIndexes(properties: PropertySignature[]): any[] {
  const indexes = [];
  for (const prop of properties) {
    const name = prop.getName();
    if (name === 'id') {
      indexes.push({ name: `pk_${name}`, columns: [name], unique: true, primaryKey: true });
    } else if (/email|phone|\w+Id$/.test(name)) {
      indexes.push({ name: `idx_${name}`, columns: [name], unique: true });
    }
  }
  return indexes;
}

function getAllProperties(interfaceDec: InterfaceDeclaration): PropertySignature[] {
  let props = [...interfaceDec.getProperties()];
  // 递归处理 extends
  for (const ext of interfaceDec.getExtends()) {
    const extType = ext.getExpression().getType().getSymbol()?.getDeclarations()?.[0];
    if (extType && extType.getKindName() === 'InterfaceDeclaration') {
      props = [...getAllProperties(extType as InterfaceDeclaration), ...props];
    }
  }
  // 去重（同名字段只保留最后一个）
  const seen = new Set();
  return props.filter(p => {
    const n = p.getName();
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

function getColumnDef(prop: PropertySignature): string {
  const name = prop.getName();
  const isOptional = prop.hasQuestionToken();
  const type = prop.getType();
  const columnType = tsTypeToColumnType(type, name);
  // id 字段自动加 primaryKey
  const pk = name === 'id' ? ', primaryKey: true' : '';
  // notNull 自动推断：可选字段为 false，否则 true
  return `    { name: '${name}', type: ${columnType}, notNull: ${!isOptional}${pk} }`;
}

const project = new Project();
const files = fs.readdirSync(TYPE_DIR).filter(f => f.endsWith('.types.ts'));

for (const fileName of files) {
  const base = fileName.replace('.types.ts', '');
  const filePath = path.join(TYPE_DIR, fileName);
  const sourceFile = project.addSourceFileAtPath(filePath);
  const interfaces = sourceFile.getInterfaces();
  if (!interfaces.length) continue;
  // 支持多 interface，主表优先规则：1. 与文件同名 2. 第一个 interface
  let mainInterface = interfaces.find(intf => intf.getName().toLowerCase() === base) || interfaces[0];
  const properties = getAllProperties(mainInterface);
  const indexes = analyzeIndexes(properties);
  const schemaFields = properties.map(getColumnDef);

  // 生成 schema 代码
  const schemaName = `${base}Schema`;
  const tableName = `${base}s`;
  const schemaFileContent = `import { TableSchema, ColumnType } from '../types';\nimport { schemaRegistry } from '../index';\n\nexport const ${schemaName}: TableSchema = {\n  name: '${tableName}',\n  columns: [\n${schemaFields.join(',\n')}\n  ],\n  indexes: [\n${indexes.map(idx => `    { name: '${idx.name}', columns: ${JSON.stringify(idx.columns)}, unique: ${!!idx.unique} }`).join(',\n')}\n  ]\n};\n\nschemaRegistry.register(${schemaName});\n\nexport default ${schemaName};\n`;

  // 支持更新已有 schema 文件（只覆盖 columns/indexes，保留其它自定义内容）
  const outPath = path.join(SCHEMA_DIR, `${base}-schema.ts`);
  if (fs.existsSync(outPath)) {
    // 简单策略：用正则替换 columns/indexes 块（更智能可用 AST）
    let content = fs.readFileSync(outPath, 'utf-8');
    content = content.replace(/columns: \[[\s\S]*?\]/, `columns: [\n${schemaFields.join(',\n')}\n  ]`);
    content = content.replace(/indexes: \[[\s\S]*?\]/, `indexes: [\n${indexes.map(idx => `    { name: '${idx.name}', columns: ${JSON.stringify(idx.columns)}, unique: ${!!idx.unique} }`).join(',\n')}\n  ]`);
    fs.writeFileSync(outPath, content, 'utf-8');
    console.log(`已更新: ${outPath}`);
  } else {
    fs.writeFileSync(outPath, schemaFileContent, 'utf-8');
    console.log(`已生成: ${outPath}`);
  }
}
