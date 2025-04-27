/**
 * 自动扫描 common.ts 中的所有 enum，生成字典表（数组/SQL/JSON均可扩展）
 * 用法：node scripts/gen-enum-dict-table.ts > enum-dict-table.json
 */
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const COMMON_PATH = path.resolve(__dirname, '../src/core/lib/db/types/common.ts');

function extractEnumsFromFile(filePath: string) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const enums: Record<string, { key: string; value: string }[]> = {};

  function visit(node: ts.Node) {
    if (ts.isEnumDeclaration(node)) {
      const enumName = node.name.text;
      const members = node.members.map(m => {
        const key = m.name.getText();
        let value = key;
        if (m.initializer && ts.isStringLiteral(m.initializer)) {
          value = m.initializer.text;
        }
        return { key, value };
      });
      enums[enumName] = members;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return enums;
}

function main() {
  const enums = extractEnumsFromFile(COMMON_PATH);
  // 输出为 JSON，可扩展为 SQL/CSV 等
  console.log(JSON.stringify(enums, null, 2));
}

main();
