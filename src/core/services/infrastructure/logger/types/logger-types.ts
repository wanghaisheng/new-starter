// logger-types.ts

import { InfrastructureServiceType, LoggerProviderType } from '@/core/lib/db/types/common';

// === 原基础设施类型迁移自 types.ts ===
export interface InfrastructureServiceConfig {
  type: InfrastructureServiceType;
  name?: string;
  [key: string]: any;
}

export enum LogLevelEnum {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export type LogLevel = keyof typeof LogLevelEnum;

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

export type LoggerProviderTypeAlias = LoggerProviderType;
