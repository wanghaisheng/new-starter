import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@/core': path.resolve(__dirname, 'src/core'),
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@mobile': path.resolve(__dirname, 'src/mobile'),
      '@web': path.resolve(__dirname, 'src/web'),
      '@db': path.resolve(__dirname, 'src/core/lib/db'),
      '@db/types': path.resolve(__dirname, 'src/core/lib/db/types'),
      '@db/interfaces': path.resolve(__dirname, 'src/core/lib/db/interfaces'),
      '@db/test': path.resolve(__dirname, 'src/core/lib/db/test'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom', // 切换为 jsdom 以支持依赖 DOM 的 React hooks 测试
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    // 支持 src/core/hooks/__tests__/*.smoke.test.ts 及其它 src/**/*.test/spec/smoke.test.ts
    include: [
      'testing/unit/**/*.test.ts',
      'testing/unit/**/*.spec.ts',
      'testing/unit/**/*.smoke.test.ts',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.smoke.test.{ts,tsx}'
    ],
    exclude: ['node_modules', 'dist', 'build', 'out', 'coverage'],
  },
});
