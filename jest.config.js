/**
 * Jest config for TypeScript + Next.js + 单元测试和类型测试分离
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@db/(.*)$': '<rootDir>/src/core/lib/db/$1',
    '^@db/types/(.*)$': '<rootDir>/src/core/lib/db/types/$1',
    '^@db/interfaces/(.*)$': '<rootDir>/src/core/lib/db/interfaces/$1',
    '^@db/test/(.*)$': '<rootDir>/src/core/lib/db/test/$1',
  },
  testMatch: [
    // 只测试实际业务逻辑，不包含 *.typecheck.ts 类型测试
    '<rootDir>/src/**/*.test.[jt]s?(x)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.typecheck.ts', // 不收集类型测试覆盖率
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/types.{js,jsx,ts,tsx}',
    '!src/**/constants.{js,jsx,ts,tsx}',
    '!src/**/styles.{js,jsx,ts,tsx}',
    '!src/**/theme.{js,jsx,ts,tsx}',
    '!src/**/config.{js,jsx,ts,tsx}',
    '!src/**/setupTests.{js,jsx,ts,tsx}',
    '!src/**/jest.setup.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
