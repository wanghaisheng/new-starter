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
    environment: 'jsdom', // 兼容 React/DOM 测试
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    include: [
      'testing/**/*.test.ts',
      'testing/**/*.spec.ts',
      'testing/**/*.smoke.test.ts',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.smoke.test.{ts,tsx}'
    ],
    exclude: ['node_modules', 'dist', 'build', 'out', 'coverage'],
  },
});
