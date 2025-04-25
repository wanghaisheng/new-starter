import { afterAll, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initConfig } from '@/core/services/infrastructure/config';

// Clean up any test databases after all tests
afterAll(() => {
  const testDir = process.cwd();
  const files = fs.readdirSync(testDir);
  for (const file of files) {
    if (file.startsWith('test_drizzle_') && file.endsWith('.sqlite')) {
      try {
        fs.unlinkSync(path.join(testDir, file));
      } catch (e) {
        console.warn('Failed to cleanup test database:', file, e);
      }
    }
  }
});

// Set up global test environment
beforeAll(async () => {
  // 初始化 configService，确保 logger/config 服务可用
  await initConfig();
  // Add any global test setup here
});

// Clean up after each test
afterEach(() => {
  // Add any per-test cleanup here
});