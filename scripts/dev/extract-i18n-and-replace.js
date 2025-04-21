// extract-i18n-and-replace.js
// CommonJS 版本，直接用 node 执行
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const APP_DIR = path.resolve(__dirname, '../../app');
const MOCK_PATH = path.resolve(__dirname, '../../src/core/services/infrastructure/config/types/translation.mock.ts');
const MOCK_VAR = 'translationMockData';
const LOCALES = ['zh', 'en'];

function extractStringsFromTSX(fileContent) {
  // 简单正则提取 JSX/TSX/HTML 中的硬编码文本（中文、英文、数字、常用符号），支持多行文本
  // 不提取 import/export/变量声明/属性名等
  const results = [];
  // 修正正则表达式，补全斜杠和尖括号
  const jsxTextRegex = />\s*([^<>{}\n\r\[\]]{2,}?)\s*</g;
  let match;
  while ((match = jsxTextRegex.exec(fileContent))) {
    const text = match[1].trim();
    if (text && /[\u4e00-\u9fa5a-zA-Z]/.test(text)) {
      results.push({ text, start: match.index + 1, end: match.index + 1 + text.length });
    }
  }
  // 属性值（如 label="xxx" placeholder="xxx"）
  const attrRegex = /\b(label|title|placeholder|alt|desc|content|message|option|button|text|header|footer|hint|toast|tab|segment|modal|sheet|error|success|empty|loading|confirm|cancel)\s*=\s*"([^"]{2,}?)"/g;
  while ((match = attrRegex.exec(fileContent))) {
    const text = match[2].trim();
    if (text && /[\u4e00-\u9fa5a-zA-Z]/.test(text)) {
      results.push({ text, start: match.index, end: match.index + match[0].length });
    }
  }
  return results;
}

function genI18nKey(text, file) {
  // 生成唯一 key，可自定义规则（如按页面路径+内容 hash）
  const page = path.basename(file, path.extname(file)).replace(/[^a-zA-Z0-9]/g, '_');
  const short = text.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '');
  return `auto.${page}.${short}`;
}

function loadMockData() {
  if (!fs.existsSync(MOCK_PATH)) return [];
  const raw = fs.readFileSync(MOCK_PATH, 'utf-8');
  const arrMatch = raw.match(/\[([\s\S]*)\]/);
  if (!arrMatch) return [];
  try {
    // 用 eval 兼容 ts 写法
    // eslint-disable-next-line no-eval
    return eval('[' + arrMatch[1] + ']');
  } catch {
    return [];
  }
}

function saveMockData(allMock) {
  const lines = [
    `export const ${MOCK_VAR} = [`,
    ...allMock.map(item => `  { key: '${item.key}', locale: '${item.locale}', value: ${JSON.stringify(item.value)}, type: '${item.type}', updatedAt: new Date('${item.updatedAt ? item.updatedAt : new Date().toISOString()}') },`),
    '];'
  ];
  fs.writeFileSync(MOCK_PATH, lines.join('\n'), 'utf-8');
}

function scanAndUpdateMock(dryRun = false) {
  const files = glob.sync(APP_DIR + '/**/*.tsx');
  const allMock = loadMockData();
  const existing = new Set(allMock.map(item => item.key + '|' + item.locale));
  const newMock = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const texts = extractStringsFromTSX(content);
    for (const { text } of texts) {
      for (const locale of LOCALES) {
        const key = genI18nKey(text, file);
        const uniq = key + '|' + locale;
        if (!existing.has(uniq)) {
          newMock.push({
            key,
            locale,
            value: locale === 'zh' ? text : '',
            type: 'auto',
            updatedAt: new Date().toISOString()
          });
          existing.add(uniq);
        }
      }
    }
  }
  if (!dryRun && newMock.length) {
    saveMockData([...allMock, ...newMock]);
    console.log(`[i18n] mock 补全完成，新增 ${newMock.length} 条`);
  } else if (dryRun) {
    console.log(`[i18n] mock 预览：`, newMock);
  } else {
    console.log('[i18n] mock 数据已全量覆盖，无需补充');
  }
}

function replaceSource(dryRun = false) {
  const files = glob.sync(APP_DIR + '/**/*.tsx');
  let replacedCount = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    const texts = extractStringsFromTSX(content);
    for (const { text } of texts) {
      const key = genI18nKey(text, file);
      // 替换标签内容
      const tagRegex = new RegExp('>' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<', 'g');
      if (tagRegex.test(content)) {
        content = content.replace(tagRegex, `{t('${key}')}`);
        changed = true;
      }
      // 替换属性值
      const attrRegex = new RegExp('([\"\"])' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([\"\"])', 'g');
      if (attrRegex.test(content)) {
        content = content.replace(attrRegex, `{t('${key}')}`);
        changed = true;
      }
    }
    if (changed && !dryRun) {
      fs.writeFileSync(file, content, 'utf-8');
      replacedCount++;
    } else if (changed && dryRun) {
      console.log(`[dry-run] ${file} 替换预览：`, texts.map(t => t.text));
    }
  }
  if (!dryRun) {
    console.log(`[i18n] 源码批量替换完成，涉及 ${replacedCount} 个文件`);
  }
}

// CLI
const arg = process.argv[2];
if (arg === '--scan') {
  scanAndUpdateMock(false);
} else if (arg === '--replace') {
  replaceSource(false);
} else if (arg === '--dry') {
  scanAndUpdateMock(true);
  replaceSource(true);
} else {
  console.log('用法: node scripts/dev/extract-i18n-and-replace.js --scan | --replace | --dry');
}
