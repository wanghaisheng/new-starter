import type { ILoggerService } from '../types/logger-types';
import { LoggerConfig, LoggerProviderType } from '../registry/logger-registry';
import { getConfigService } from '@/core/services/infrastructure/config';
import { LoggerService } from '../service/logger-service';
import { MockLoggerAdapter } from '../adapters/mock-adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-adapter';
import { PinoLoggerAdapter } from '../adapters/pino-adapter';

/**
 * 插件化 Logger 工厂，内置+动态适配器统一管理。
 * 变量优先级解析后统一调用 getAdapter。
 * 风格与 bluetooth-service-factory 完全一致。
 */
export class LoggerFactory {
  private static adapters: Record<LoggerProviderType, (config?: LoggerConfig) => ILoggerService> = {
    mock: () => MockLoggerAdapter.getInstance(),
    winston: () => WinstonLoggerAdapter.getInstance(),
    pino: () => PinoLoggerAdapter.getInstance(),
    default: () => LoggerService.getInstance(),
  };

  /**
   * 注册动态适配器（插件/扩展）
   */
  static registerAdapter(provider: LoggerProviderType, factory: (config?: LoggerConfig) => ILoggerService) {
    this.adapters[provider] = factory;
  }

  /**
   * 获取适配器实例
   */
  static getAdapter(provider: LoggerProviderType, config?: LoggerConfig): ILoggerService | undefined {
    const factory = this.adapters[provider];
    return factory ? factory(config) : undefined;
  }

  /**
   * 创建 Logger 实例，变量优先级：参数 > config > 配置服务 > 环境变量 > 默认
   */
  static createLogger(config: LoggerConfig = {}): ILoggerService {
    let provider: LoggerProviderType;
    let configService: any = undefined;
    try {
      configService = getConfigService?.();
    } catch (e) {
      configService = undefined;
    }
    provider =
      config.provider ||
      (configService?.get?.('LOGGER_PROVIDER')) ||
      (configService?.get?.('NEXT_PUBLIC_LOGGER_PROVIDER')) ||
      (configService?.get?.('NEXT_PUBLIC_LOG_STORAGE_PROVIDER')) ||
      process.env.NEXT_PUBLIC_LOG_STORAGE_PROVIDER ||
      process.env.NEXT_PUBLIC_LOGGER_PROVIDER ||
      process.env.LOGGER_PROVIDER ||
      'default';

    if (!provider) provider = 'default';

    const logger = this.getAdapter(provider, config) || this.getAdapter('default', config);
    if (!logger) {
      throw new Error(`[LoggerFactory] 未找到有效 logger provider: ${provider}`);
    }
    return logger;
  }
}
