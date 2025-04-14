/**
 * 使用 Mock 环境运行应用程序的脚本
 * 同时使用 MockDatabaseClient 和 MockIndexedDBClient
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查环境配置文件
const mockEnvFile = path.join(__dirname, '.env.mock');
const devEnvFile = path.join(__dirname, '.env.development');

// 优先使用.env.mock文件，如果不存在则使用.env.development
let envFile = fs.existsSync(mockEnvFile) ? mockEnvFile : devEnvFile;
const envContent = fs.readFileSync(envFile, 'utf8');

// 如果使用的是.env.development，提示用户创建.env.mock文件
if (envFile === devEnvFile) {
  console.warn('警告: 未找到.env.mock文件，正在使用.env.development作为备选。建议创建.env.mock文件以配置mock环境。');
}

// 检查必要的环境变量是否设置正确
const requiredVars = {
  'NEXT_PUBLIC_DATABASE_ENV': 'mock',
  'NEXT_PUBLIC_MOCK_DB_TYPE': 'mock', 
  'NEXT_PUBLIC_USE_FAKE_INDEXEDDB': 'true',
  'NEXT_PUBLIC_DB_NAME': 'app_database_mock',
  'NEXT_PUBLIC_DB_SYNC_ENABLED': 'false',
  'NODE_ENV': 'development'
};

let needsUpdate = false;
let updatedContent = envContent;

Object.entries(requiredVars).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (!regex.test(envContent)) {
    // 变量不存在，添加它
    updatedContent += `\n${key}=${value}`;
    needsUpdate = true;
    console.log(`添加环境变量: ${key}=${value}`);
  } else if (!envContent.match(new RegExp(`^${key}=${value}$`, 'm'))) {
    // 变量存在但值不同，更新它
    updatedContent = updatedContent.replace(regex, `${key}=${value}`);
    needsUpdate = true;
    console.log(`更新环境变量: ${key}=${value}`);
  }
});

// 如果需要，更新环境配置文件
if (needsUpdate) {
  fs.writeFileSync(envFile, updatedContent);
  console.log(`${envFile} 文件已更新`);
}

// 创建数据目录（如果不存在）
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('创建数据目录: data/');
}

// 设置环境变量
const env = { ...process.env };
Object.entries(requiredVars).forEach(([key, value]) => {
  env[key] = value;
});

// 为 JSON 文件创建初始内容（如果不存在）
const mockDbFile = path.join(dataDir, 'mock-db.json');
if (!fs.existsSync(mockDbFile)) {
  const initialData = {
    users: [
      {
        id: '1',
        name: '张三',
        bio: '喜欢音乐和旅行',
        gender: 'male',
        birthDate: '1995-05-15',
        photos: ['/images/avatar-1.jpg'],
        interests: ['音乐', '旅行', '摄影'],
        location: {
          latitude: 31.2304,
          longitude: 121.4737,
          city: '上海',
          country: '中国'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '李四',
        bio: '热爱运动和户外活动',
        gender: 'male',
        birthDate: '1990-10-20',
        photos: ['/images/avatar-2.jpg'],
        interests: ['健身', '足球', '远足'],
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          city: '北京',
          country: '中国'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '王五',
        bio: '爱好阅读和电影',
        gender: 'female',
        birthDate: '1998-03-25',
        photos: ['/images/avatar-3.jpg'],
        interests: ['阅读', '电影', '烹饪'],
        location: {
          latitude: 23.1291,
          longitude: 113.2644,
          city: '广州',
          country: '中国'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    matches: [],
    messages: []
  };
  
  fs.writeFileSync(mockDbFile, JSON.stringify(initialData, null, 2));
  console.log('创建初始 mock 数据文件: data/mock-db.json');
}

// 在运行应用前尝试清理旧的数据库文件
console.log('尝试清理旧的IndexedDB数据...');
if (fs.existsSync(path.join(__dirname, '.next', 'cache'))) {
  try {
    fs.rmSync(path.join(__dirname, '.next', 'cache'), { recursive: true, force: true });
    console.log('已清理 .next/cache 目录');
  } catch (e) {
    console.warn('清理 .next/cache 失败:', e);
  }
}

// 设置所有必要的环境变量
Object.entries(requiredVars).forEach(([key, value]) => {
  process.env[key] = value;
});

// 运行应用程序
console.log('使用 Mock 环境启动应用程序...');
try {
  // 使用spawn直接运行next命令，确保环境变量被正确传递
  const isWindows = process.platform === 'win32';
  const nextBinPath = path.join(__dirname, 'node_modules', '.bin', isWindows ? 'next.cmd' : 'next');
  
  if (!fs.existsSync(nextBinPath)) {
    throw new Error(`Next.js executable not found at ${nextBinPath}`);
  }

  console.log(`使用本地Next.js可执行文件: ${nextBinPath}`);
  const nextProcess = spawn(nextBinPath, ['dev'], { 
    stdio: 'inherit',
    env: { ...process.env, ...env }, // 合并所有环境变量
    shell: isWindows
  });

  // 处理进程事件
  nextProcess.on('error', (err) => {
    console.error('启动应用程序时出错:', err);
    process.exit(1);
  });
  
  // 将主进程的退出信号传递给子进程
  process.on('SIGINT', () => {
    nextProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM');
  });
  
  // 等待子进程退出
  nextProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`应用程序异常退出，退出码: ${code}`);
    }
    process.exit(code);
  });
} catch (error) {
  console.error('启动应用程序时出错:', error);
  process.exit(1);
}