// error-types.ts
import type { InfrastructureServiceConfig } from '@/core/services/infrastructure/types';

export enum ErrorLevelEnum {
  CRITICAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3
}

export type ErrorLevel = keyof typeof ErrorLevelEnum;

// 独立声明 ErrorServiceType，避免与 logger/conflict
export enum ErrorServiceType {
  ERROR = 'error',
}

export interface IErrorService {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;
  setLevel(level: ErrorLevel): void;
  capture(error: Error | unknown, context?: any): void;
  report(error: Error | unknown, context?: any): Promise<void>;
  showUserError(message: string, options?: { toast?: boolean; dialog?: boolean }): void;
  setHandler(handler: (error: Error | unknown, context?: any) => void): void;
  getServiceType(): ErrorServiceType;
  getConfig(): InfrastructureServiceConfig;
}
