// mock-adapter.ts
import { LogLevel } from '@/core/services/infrastructure/logger/types/logger-types';
import { ILoggerService } from '@/core/services/infrastructure/types';

export class MockLoggerAdapter implements ILoggerService {
  private static instance: MockLoggerAdapter;
  static getInstance() {
    if (!MockLoggerAdapter.instance) {
      MockLoggerAdapter.instance = new MockLoggerAdapter();
    }
    return MockLoggerAdapter.instance;
  }
  debug(...args: any[]): void {}
  info(...args: any[]): void {}
  warn(...args: any[]): void {}
  error(...args: any[]): void {}
}
