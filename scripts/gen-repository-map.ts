// 自动生成 RepositoryMap 类型声明文件
// 用法：npx tsx scripts/gen-repository-map.ts
// 会扫描 types 目录下所有 *-repository.types.ts 文件，生成统一的 RepositoryMap 类型声明

import * as fs from 'fs';
import * as path from 'path';

const TYPES_DIR = path.resolve(__dirname, '../src/core/lib/db/repositories/types');
const OUTPUT_FILE = path.resolve(__dirname, '../src/core/lib/db/repositories/registry/repository-map.ts');

function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function scanRepositoryTypes() {
  return fs.readdirSync(TYPES_DIR)
    .filter(f => f.endsWith('-repository.types.ts'))
    .filter(f => f !== 'base-repository.types.ts') // 屏蔽 base-repository.types.ts
    .map(f => {
      const key = f.replace('-repository.types.ts', ''); // user, photo, ...
      const interfaceName = 'I' + key.charAt(0).toUpperCase() + key.slice(1) + 'Repository';
      return { file: f, key, interfaceName };
    });
}

function main() {
  const types = scanRepositoryTypes();
  const imports = types.map(t => `import { ${t.interfaceName} } from '../types/${t.key}-repository.types';`).join('\n');
  const keys = types.map(t => `'${t.key}'`).join(' | ');
  const map = types.map(t => `  ${t.key}: ${t.interfaceName};`).join('\n');
  const content = `// 本文件由 scripts/gen-repository-map.ts 自动生成，请勿手动修改\n${imports}\n\nexport type RepositoryKey = ${keys};\n\nexport interface RepositoryMap {\n${map}\n}\n`;
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  console.log('已自动生成 repository-map.ts');
}

main();
