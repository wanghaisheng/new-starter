// run-env.js
const fs = require('fs');
const path = require('path');

const envFile = process.argv[2] || '.env.development';
const targetEnv = path.join(__dirname, '.env');
const sourceEnv = path.join(__dirname, envFile);

if (!fs.existsSync(sourceEnv)) {
  console.error(`未找到 ${envFile} 文件，无法切换环境`);
  process.exit(1);
}

fs.copyFileSync(sourceEnv, targetEnv);
console.log(`已将 ${envFile} 内容复制到 .env`);