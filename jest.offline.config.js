/**
 * Jest配置，专门用于离线功能测试
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // 指向Next.js应用的根目录
  dir: './',
});

const customJestConfig = {
  // 指定测试环境
  testEnvironment: 'jsdom',
  
  // 匹配离线测试文件
  testMatch: [
    '**/__tests__/**/*.offline.test.[jt]s?(x)',
    '**/test/**/*.offline.test.[jt]s?(x)',
    '**/offline/**/*.offline.test.[jt]s?(x)'
  ],
  
  // 忽略特定目录
  testPathIgnorePatterns: [
    '/node_modules/', 
    '/.next/'
  ],
  
  // 模拟特定模块
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 测试超时设置（网络测试可能需要更长时间）
  testTimeout: 15000,
  
  // 转换源码
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // 模拟对象(如浏览器API)的设置
  setupFiles: ['<rootDir>/jest.offline.setup.js'],
  
  // 在每个测试文件前准备环境
  setupFilesAfterEnv: ['<rootDir>/jest.offline.after-env.js'],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage/offline',
  
  // 要求至少80%的覆盖率
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 启用使用fakeTimers模拟时间
  fakeTimers: {
    enableGlobally: true,
  },
  
  // 并行运行测试
  maxWorkers: '50%',
  
  // 显示测试运行的详细信息
  verbose: true,
};

// createJestConfig会自动读取next.config.js和package.json中的配置
module.exports = createJestConfig(customJestConfig); 