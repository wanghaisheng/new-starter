// 自动扫描 common.ts 中的所有 enum，生成字典表（JSON）
// 用法：node scripts/gen-enum-dict-table.js > enum-dict-table.json
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const COMMON_PATH = path.resolve(__dirname, '../src/core/lib/db/types/common.ts');

function extractEnumsFromFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const enums = {};

  function visit(node) {
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
  console.log(JSON.stringify(enums, null, 2));
}

main();
