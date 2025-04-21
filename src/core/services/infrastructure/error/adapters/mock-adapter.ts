// mock-adapter.ts
import { ErrorLevel, IErrorService, ErrorServiceType } from '@/core/services/infrastructure/error/types/error-types';
import type { InfrastructureServiceConfig } from '@/core/services/infrastructure/types';

export class MockErrorAdapter implements IErrorService {
  private static instance: MockErrorAdapter;
  private config: InfrastructureServiceConfig = { id: 'error-mock', type: ErrorServiceType.ERROR };
  private _isInitialized = false;
  private errorLevel: ErrorLevel = 'ERROR';
  private handler?: (error: Error | unknown, context?: any) => void;

  private constructor() {}

  static getInstance(): MockErrorAdapter {
    if (!MockErrorAdapter.instance) {
      MockErrorAdapter.instance = new MockErrorAdapter();
    }
    return MockErrorAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  setLevel(level: ErrorLevel): void { this.errorLevel = level; }
  capture(error: Error | unknown, context?: any): void {}
  async report(error: Error | unknown, context?: any): Promise<void> {}
  showUserError(message: string, options?: { toast?: boolean; dialog?: boolean }): void {}
  setHandler(handler: (error: Error | unknown, context?: any) => void): void { this.handler = handler; }
  getServiceType(): ErrorServiceType { return ErrorServiceType.ERROR; }
  getConfig(): InfrastructureServiceConfig { return this.config; }
}
