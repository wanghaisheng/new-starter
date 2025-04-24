// mock-adapter.ts
import { LogLevel } from '@/core/services/infrastructure/logger/types/logger-types';
import { ILoggerService, InfrastructureServiceType, InfrastructureServiceConfig } from '@/core/services/infrastructure/logger/types/logger-types';

export class MockLoggerAdapter implements ILoggerService {
  private static instance: MockLoggerAdapter;
  static getInstance() {
    if (!MockLoggerAdapter.instance) {
      MockLoggerAdapter.instance = new MockLoggerAdapter();
    }
    return MockLoggerAdapter.instance;
  }
  async initialize(): Promise<void> { /* mock init */ }
  async dispose(): Promise<void> { /* mock dispose */ }
  isInitialized(): boolean { return true; }
  setLevel(level: LogLevel): void { /* mock setLevel */ }
  debug(...args: any[]): void { /* mock debug */ }
  info(...args: any[]): void { /* mock info */ }
  warn(...args: any[]): void { /* mock warn */ }
  error(...args: any[]): void { /* mock error */ }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.LOGGER; }
  getConfig(): InfrastructureServiceConfig { return { id: 'mock-logger', type: 'logger' }; }
}
