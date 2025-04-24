// 自动生成 auto-register-adapters.ts 脚本
// 用法：npx tsx scripts/gen-auto-register-adapters.ts
// 会扫描 adapters 目录下所有 *-repository-*.ts 文件并写入 import 语句

import * as fs from 'fs';
import * as path from 'path';

const ADAPTERS_DIR = path.resolve(__dirname, '../src/core/lib/db/repositories/adapters');
const OUTPUT_FILE = path.resolve(__dirname, '../src/core/lib/db/repositories/factory/auto-register-adapters.ts');

function scanAdapters() {
  return fs.readdirSync(ADAPTERS_DIR)
    .filter(f => f.endsWith('.ts') && /-repository-/.test(f))
    .map(f => `import '../adapters/${f.replace(/\\/g, '/')}';`);
}

function main() {
  const header = `// 自动批量注册所有内置/自定义适配器工厂\n// 本文件由 scripts/gen-auto-register-adapters.ts 自动生成，请勿手动修改\n`;
  const imports = scanAdapters().join('\n');
  const content = `${header}\n${imports}\n`;
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  console.log('已自动生成 auto-register-adapters.ts');
}

main();
