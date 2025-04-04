#!/usr/bin/env node

/**
 * 自动化测试运行脚本
 * 
 * 此脚本用于运行项目中的各种测试，包括：
 * - 单元测试 (Unit Tests)
 * - 集成测试 (Integration Tests)
 * - 端到端测试 (E2E Tests)
 * - 性能测试 (Performance Tests)
 * - 离线功能测试 (Offline Tests)
 * 
 * 使用方法:
 * - 运行所有测试: node scripts/run-tests.js --all
 * - 运行特定类型测试: node scripts/run-tests.js --unit --integration
 * - 生成覆盖率报告: node scripts/run-tests.js --all --coverage
 * - 生成HTML报告: node scripts/run-tests.js --all --report
 * - CI模式运行: node scripts/run-tests.js --all --ci
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 参数解析
const args = process.argv.slice(2);
const options = {
  unit: args.includes('--unit') || args.includes('--all'),
  integration: args.includes('--integration') || args.includes('--all'),
  e2e: args.includes('--e2e') || args.includes('--all'),
  performance: args.includes('--performance') || args.includes('--all'),
  offline: args.includes('--offline') || args.includes('--all'),
  coverage: args.includes('--coverage'),
  report: args.includes('--report'),
  ci: args.includes('--ci'),
  help: args.includes('--help') || args.includes('-h'),
};

// 显示帮助信息
if (options.help || args.length === 0) {
  console.log(chalk.bold.blue('自动化测试运行脚本 - 使用帮助\n'));
  console.log('用法: node scripts/run-tests.js [选项]\n');
  console.log('选项:');
  console.log('  --all           运行所有类型的测试');
  console.log('  --unit          运行单元测试');
  console.log('  --integration   运行集成测试');
  console.log('  --e2e           运行端到端测试');
  console.log('  --performance   运行性能测试');
  console.log('  --offline       运行离线功能测试');
  console.log('  --coverage      生成覆盖率报告');
  console.log('  --report        生成HTML测试报告');
  console.log('  --ci            CI模式运行（无交互）');
  console.log('  --help, -h      显示帮助信息\n');
  console.log('示例:');
  console.log('  node scripts/run-tests.js --all');
  console.log('  node scripts/run-tests.js --unit --integration');
  console.log('  node scripts/run-tests.js --e2e --report');
  process.exit(0);
}

// 测试配置
const testConfigs = {
  unit: {
    command: 'jest',
    args: ['--testPathPattern=src/test/unit', '--passWithNoTests'],
    label: '单元测试',
    color: chalk.green,
  },
  integration: {
    command: 'jest',
    args: ['--testPathPattern=src/test/integration', '--passWithNoTests'],
    label: '集成测试',
    color: chalk.blue,
  },
  e2e: {
    command: 'cypress',
    args: ['run'],
    label: '端到端测试',
    color: chalk.magenta,
  },
  performance: {
    command: 'jest',
    args: ['--testPathPattern=src/test/performance', '--passWithNoTests'],
    label: '性能测试',
    color: chalk.yellow,
  },
  offline: {
    command: 'jest',
    args: ['--config=jest.offline.config.js', '--passWithNoTests'],
    label: '离线功能测试',
    color: chalk.cyan,
  },
};

// 覆盖率配置
if (options.coverage) {
  Object.keys(testConfigs).forEach(key => {
    if (testConfigs[key].command === 'jest') {
      testConfigs[key].args.push('--coverage');
    }
  });
}

// CI模式配置
if (options.ci) {
  Object.keys(testConfigs).forEach(key => {
    if (testConfigs[key].command === 'jest') {
      testConfigs[key].args.push('--ci');
    }
    if (key === 'e2e') {
      testConfigs[key].args.push('--headless');
    }
  });
}

// 报告配置
if (options.report) {
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  Object.keys(testConfigs).forEach(key => {
    if (testConfigs[key].command === 'jest') {
      testConfigs[key].args.push('--json');
      testConfigs[key].args.push(`--outputFile=reports/${key}-results.json`);
    }
    if (key === 'e2e') {
      testConfigs[key].args.push('--reporter=junit');
      testConfigs[key].args.push('--reporter-options=mochaFile=reports/e2e-results.xml');
    }
  });
}

/**
 * 运行测试命令
 * @param {string} type 测试类型
 * @returns {Promise<number>} 进程退出码
 */
function runTest(type) {
  return new Promise((resolve, reject) => {
    const config = testConfigs[type];
    const color = config.color;
    
    console.log(color(`\n开始运行${config.label}...\n`));
    
    const cmd = spawn(config.command, config.args, { 
      stdio: 'inherit',
      shell: true 
    });

    cmd.on('close', (code) => {
      if (code === 0) {
        console.log(color(`\n${config.label}完成 ✓\n`));
        resolve(0);
      } else {
        console.error(color(`\n${config.label}失败 ✗ (退出码: ${code})\n`));
        resolve(code);
      }
    });

    cmd.on('error', (err) => {
      console.error(color(`\n${config.label}出错: ${err}\n`));
      reject(err);
    });
  });
}

/**
 * 生成汇总报告
 */
function generateSummaryReport() {
  if (!options.report) return;
  
  console.log(chalk.bold.white('\n生成测试汇总报告...\n'));
  
  const reportDir = path.join(__dirname, '..', 'reports');
  const reportFiles = fs.readdirSync(reportDir);
  const results = {};
  
  // 收集所有测试结果
  reportFiles.forEach(file => {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(reportDir, file), 'utf8');
      try {
        const data = JSON.parse(content);
        const type = file.split('-')[0];
        results[type] = data;
      } catch (err) {
        console.error(`解析测试结果失败: ${file}`);
      }
    }
  });
  
  // 生成HTML汇总报告
  const reportPath = path.join(reportDir, 'summary.html');
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>测试汇总报告</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #333; }
      .summary { margin-bottom: 20px; }
      .stats { display: flex; gap: 20px; margin-bottom: 20px; }
      .stat-card { 
        padding: 15px;
        border-radius: 8px;
        color: white;
        min-width: 120px;
      }
      .passed { background-color: #4CAF50; }
      .failed { background-color: #F44336; }
      .skipped { background-color: #FFC107; }
      .total { background-color: #2196F3; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      .test-type { font-weight: bold; margin-top: 30px; }
      .fail-details { color: #F44336; }
    </style>
  </head>
  <body>
    <h1>测试汇总报告</h1>
    <div class="summary">
      <p>生成时间: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
  `;
  
  // 计算总体统计
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  Object.keys(results).forEach(type => {
    const result = results[type];
    if (result && result.numTotalTests) {
      totalTests += result.numTotalTests;
      totalPassed += result.numPassedTests;
      totalFailed += result.numFailedTests;
      totalSkipped += result.numPendingTests || 0;
    }
  });
  
  // 添加统计卡片
  html += `
    <div class="stat-card total">
      <h3>总测试数</h3>
      <p>${totalTests}</p>
    </div>
    <div class="stat-card passed">
      <h3>通过</h3>
      <p>${totalPassed}</p>
    </div>
    <div class="stat-card failed">
      <h3>失败</h3>
      <p>${totalFailed}</p>
    </div>
    <div class="stat-card skipped">
      <h3>跳过</h3>
      <p>${totalSkipped}</p>
    </div>
  </div>
  `;
  
  // 添加详细测试结果
  html += '<h2>详细测试结果</h2>';
  
  Object.keys(results).forEach(type => {
    const result = results[type];
    if (!result) return;
    
    html += `<div class="test-type">${testConfigs[type].label} (${result.numPassedTests}/${result.numTotalTests})</div>`;
    
    html += `
    <table>
      <tr>
        <th>测试套件</th>
        <th>状态</th>
        <th>时间</th>
        <th>详情</th>
      </tr>
    `;
    
    result.testResults.forEach(suite => {
      const status = suite.status === 'passed' ? '通过' : '失败';
      const statusClass = suite.status === 'passed' ? 'passed' : 'failed';
      
      html += `
      <tr>
        <td>${suite.name.replace(process.cwd(), '')}</td>
        <td class="${statusClass}">${status}</td>
        <td>${suite.endTime - suite.startTime}ms</td>
        <td>
      `;
      
      if (suite.status !== 'passed') {
        suite.assertionResults.forEach(test => {
          if (test.status !== 'passed') {
            html += `<div class="fail-details">${test.fullName}: ${test.failureMessages.join('<br/>')}</div>`;
          }
        });
      }
      
      html += '</td></tr>';
    });
    
    html += '</table>';
  });
  
  html += `
  </body>
  </html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(chalk.bold.green(`\n汇总报告已生成: ${reportPath}\n`));
}

/**
 * 主运行函数
 */
async function run() {
  console.log(chalk.bold.blue('\n====== 开始运行自动化测试 ======\n'));
  
  const startTime = Date.now();
  const results = {};
  let hasFailures = false;
  
  // 依次运行所有选中的测试
  for (const type of Object.keys(testConfigs)) {
    if (options[type]) {
      try {
        const exitCode = await runTest(type);
        results[type] = exitCode;
        if (exitCode !== 0) {
          hasFailures = true;
        }
      } catch (err) {
        console.error(chalk.red(`运行${testConfigs[type].label}时出错: ${err}`));
        results[type] = 1;
        hasFailures = true;
      }
    }
  }
  
  // 生成报告
  if (options.report) {
    generateSummaryReport();
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(chalk.bold.blue(`\n====== 测试运行完成 (${duration}秒) ======\n`));
  
  // 打印结果摘要
  console.log(chalk.bold.white('测试结果摘要:\n'));
  Object.keys(results).forEach(type => {
    const exitCode = results[type];
    const config = testConfigs[type];
    const statusText = exitCode === 0 ? '通过 ✓' : '失败 ✗';
    const statusColor = exitCode === 0 ? chalk.green : chalk.red;
    console.log(`${config.color(config.label)}: ${statusColor(statusText)}`);
  });
  
  // 设置退出码
  process.exit(hasFailures ? 1 : 0);
}

// 开始运行
run().catch(err => {
  console.error(chalk.red(`\n运行测试脚本时出错: ${err}\n`));
  process.exit(1);
}); 