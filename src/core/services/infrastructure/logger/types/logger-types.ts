// logger-types.ts
import type { InfrastructureServiceConfig, InfrastructureServiceType } from '@/core/services/infrastructure/types';

export enum LogLevelEnum {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export type LogLevel = keyof typeof LogLevelEnum;

// 关键：用 export type { ... } re-export type（isolatedModules 兼容）
export type { InfrastructureServiceConfig, InfrastructureServiceType };

// 只在此处唯一声明 ILoggerService，避免与 types.ts 冲突
export interface ILoggerService {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;
  setLevel(level: LogLevel): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  getServiceType(): InfrastructureServiceType;
  getConfig(): InfrastructureServiceConfig;
}
