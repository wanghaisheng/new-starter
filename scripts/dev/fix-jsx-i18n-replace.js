// fix-jsx-i18n-replace.js
// 用于修复被 i18n 批量替换脚本破坏的 JSX 标签结构
// 用法：node scripts/dev/fix-jsx-i18n-replace.js <target_file_or_glob>

const fs = require('fs');
const path = require('path');
const glob = require('glob');

if (process.argv.length < 3) {
  console.error('Usage: node fix-jsx-i18n-replace.js <target_file_or_glob>');
  process.exit(1);
}

const target = process.argv[2];
const files = glob.sync(target, { nodir: true });

// 匹配 <Tag ...{t('key')}/Tag> 错误写法，修复为标准 JSX
const brokenJsxRegex = /(<([A-Za-z0-9]+)[^>]*?)\{t\(([^}]+)\)\}\/\2>/g;
// 匹配 <Tag ...{t('key')}/Tag> 但属性后无空格的情况
const brokenJsxNoSpace = /(<([A-Za-z0-9]+)[^>]*?)\{t\(([^}]+)\)\}\/(\2)>/g;
// 匹配 <Tag ...{t('key')}/Tag> 但属性后无空格且有自闭合的情况
const brokenJsxSelfClose = /(<([A-Za-z0-9]+)[^>]*?)\{t\(([^}]+)\)\}\s*\/>(?!\s*<)/g;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // 通用修复（针对常见被误替换的 JSX 标签）
  content = content.replace(/(<[A-Za-z0-9]+[^>]*?)\{t\(([^}]+)\)\}\/(\w+)>/g, (_m, before, key, tag) => {
    return `${before}>\n  {t(${key})}\n</${tag}>`;
  });
  // 修复 <p ...{t('key')}/p> 这类标签
  content = content.replace(/(<p[^>]*?)\{t\(([^}]+)\)\}\/p>/g, (_m, before, key) => {
    return `${before}>\n  {t(${key})}\n</p>`;
  });
  // 修复 <hN ...{t('key')}/hN> 这类标签
  content = content.replace(/(<h[1-6][^>]*?)\{t\(([^}]+)\)\}\/h([1-6])>/g, (_m, before, key, n) => {
    return `${before}>\n  {t(${key})}\n</h${n}>`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`No change: ${file}`);
  }
});
