#!/usr/bin/env node

/**
 * 检查相对导入路径脚本
 * 
 * 这个脚本用于扫描项目中的 .ts 和 .tsx 文件，
 * 查找并报告使用相对路径而非 @/ 前缀绝对路径的导入语句。
 * 
 * 用法：
 *   node tools/check-import-paths.js
 *   
 * 选项：
 *   --fix       尝试自动修复相对导入路径
 *   --dir=path  仅扫描指定目录，默认扫描 src 和 app 目录
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 解析命令行参数
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const dirArg = args.find(arg => arg.startsWith('--dir='));
const targetDirs = dirArg ? [dirArg.split('=')[1]] : ['src', 'app'];

// 正则表达式，用于匹配相对导入路径
const relativeImportRegex = /import\s+(?:{[\s\w,]*}|\w+)\s+from\s+['"](\.|\.\.)[\/\\][^'"]*['"]/g;

// 用于存储检测到的相对导入路径
const relativeImports = [];

// 递归扫描目录中的 .ts 和 .tsx 文件
function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // 跳过测试文件
        if (file.includes('.test.') || file.includes('.spec.')) continue;
        
        // 跳过类型声明文件
        if (file.endsWith('.d.ts')) continue;
        
        // 读取文件内容并检查相对导入
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = [...content.matchAll(relativeImportRegex)];
        
        if (matches.length > 0) {
          relativeImports.push({
            file: filePath,
            matches: matches.map(match => match[0])
          });
          
          // 如果启用了修复模式，尝试修复相对导入
          if (shouldFix) {
            fixRelativeImports(filePath, content);
          }
        }
      }
    }
  } catch (error) {
    console.error(`扫描目录 ${dir} 时出错:`, error.message);
  }
}

// 尝试修复相对导入路径
function fixRelativeImports(filePath, content) {
  try {
    // 这里是一个简单的示例，实际修复可能需要更复杂的逻辑
    console.log(`正在修复文件: ${filePath}`);
    
    // 运行 ESLint 自动修复
    execSync(`npx eslint ${filePath} --fix`, { stdio: 'ignore' });
    
    console.log(`已修复文件: ${filePath}`);
  } catch (error) {
    console.error(`修复文件 ${filePath} 时出错:`, error.message);
  }
}

// 主函数
function main() {
  console.log('开始检查相对导入路径...');
  
  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      console.log(`正在扫描目录: ${dir}`);
      scanDirectory(dir);
    } else {
      console.warn(`目录不存在，跳过: ${dir}`);
    }
  }
  
  // 输出结果
  if (relativeImports.length === 0) {
    console.log('恭喜! 没有检测到相对导入路径。');
  } else {
    console.log(`检测到 ${relativeImports.length} 个文件包含相对导入路径:`);
    
    for (const item of relativeImports) {
      console.log(`\n文件: ${item.file}`);
      item.matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match}`);
      });
    }
    
    if (shouldFix) {
      console.log('\n已尝试修复上述文件中的相对导入路径。');
      console.log('请检查修改是否正确，并运行测试以确保功能正常。');
    } else {
      console.log('\n要尝试自动修复这些问题，请使用 --fix 选项:');
      console.log('  node tools/check-import-paths.js --fix');
    }
  }
}

// 执行主函数
main(); 