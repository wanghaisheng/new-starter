import type { ILoggerService } from '@/core/services/infrastructure/logger/types/logger-types';
import { LoggerService } from '../service/logger-service';
import { MockLoggerAdapter } from '../adapters/mock-adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-adapter';
import { PinoLoggerAdapter } from '../adapters/pino-adapter';

export type LoggerProviderType = 'mock' | 'winston' | 'pino' | 'default' | string;
export interface LoggerConfig {
  provider?: LoggerProviderType;
  name?: string;
  [key: string]: any;
}

/**
 * 插件化 Logger 注册表，统一适配器注册/检测/获取/枚举
 * 推荐仅用于插件/底层扩展，业务层优先用 LoggerFactory
 */
class LoggerRegistry {
  private static adapters: Record<LoggerProviderType, (config?: LoggerConfig) => ILoggerService> = {
    mock: () => MockLoggerAdapter.getInstance(),
    winston: () => WinstonLoggerAdapter.getInstance(),
    pino: () => PinoLoggerAdapter.getInstance(),
    default: () => LoggerService.getInstance(),
  };

  /**
   * 注册适配器
   */
  static registerAdapter(provider: LoggerProviderType, factory: (config?: LoggerConfig) => ILoggerService) {
    this.adapters[provider] = factory;
  }

  /**
   * 检查 provider 是否已注册
   */
  static isAdapterRegistered(provider: LoggerProviderType): boolean {
    return !!this.adapters[provider];
  }

  /**
   * 获取 provider 实例
   */
  static getAdapter(provider: LoggerProviderType, config?: LoggerConfig): ILoggerService | undefined {
    const factory = this.adapters[provider];
    return factory ? factory(config) : undefined;
  }

  /**
   * 获取所有已注册 provider 名称
   */
  static getAvailableProviders(): LoggerProviderType[] {
    return Object.keys(this.adapters) as LoggerProviderType[];
  }
}

/**
 * 兼容原有导出，便于早期启动/兜底
 */
let instance: ILoggerService | undefined;

export function setLoggerService(logger: ILoggerService) {
  instance = logger;
}

export function createDefaultLogger(): ILoggerService {
  return {
    info: (...args: any[]) => console.info('[default-logger]', ...args),
    warn: (...args: any[]) => console.warn('[default-logger]', ...args),
    error: (...args: any[]) => console.error('[default-logger]', ...args),
    debug: (...args: any[]) => console.debug('[default-logger]', ...args),
  } as ILoggerService;
}

export function createLoggerFromConfig(config: any): ILoggerService {
  const provider = config?.provider || config?.type || config?.name || 'default';
  return LoggerRegistry.getAdapter(provider, config) || LoggerRegistry.getAdapter('default')!;
}

export function createLoggerService(provider: string): ILoggerService {
  return LoggerRegistry.getAdapter(provider as LoggerProviderType) || LoggerRegistry.getAdapter('default')!;
}

export {
  LoggerRegistry,
};
