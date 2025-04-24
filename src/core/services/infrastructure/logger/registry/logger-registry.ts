// 多实现 LoggerService 适配器注册表
import { ILoggerService } from '@/core/services/infrastructure/logger/types/logger-types';
import { LoggerService } from '../service/logger-service';
import { MockLoggerAdapter } from '../adapters/mock-adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-adapter';
import { PinoLoggerAdapter } from '../adapters/pino-adapter';
import { configService } from '@/core/services/infrastructure/config';

// 插件注册工厂
const loggerAdapterRegistry: Record<string, () => ILoggerService> = {
  'mock': MockLoggerAdapter.getInstance,
  'winston': WinstonLoggerAdapter.getInstance,
  'pino': PinoLoggerAdapter.getInstance,
  'default': LoggerService.getInstance,
};

/**
 * 动态注册新的 logger provider（插件/适配器）。
 * @param name provider 名称（如 'custom'）
 * @param factory 单例工厂方法
 */
export function registerLoggerProvider(name: string, factory: () => ILoggerService) {
  loggerAdapterRegistry[name] = factory;
}

/**
 * 获取所有已注册的 logger provider 名称。
 */
export function getAvailableLoggerProviders(): string[] {
  return Object.keys(loggerAdapterRegistry);
}

let instance: ILoggerService | undefined;
let lastProvider: string | undefined;

/**
 * 获取全局唯一 logger 实例，支持配置热切换和插件式扩展。
 * - 严格通过 configService.get('LOGGER_PROVIDER') 选择 provider
 * - 支持 runtime 切换 logger provider，自动重建实例
 * - 仅通过注册表暴露，禁止直接 new/adapter/factory
 * - 支持插件注册工厂，便于后续扩展
 */
export function getLoggerService(): ILoggerService {
  const loggerProvider = String(configService.get('LOGGER_PROVIDER'));
  if (!instance || loggerProvider !== lastProvider) {
    const factory = loggerAdapterRegistry[loggerProvider] || loggerAdapterRegistry['default'];
    instance = factory();
    lastProvider = loggerProvider;
  }
  return instance!;
}

/**
 * 创建新的 logger 实例（如需多实例/非单例场景）。
 * 一般不推荐业务层直接调用，建议优先用 getLoggerService()
 * @param provider provider 名称
 */
export function createLoggerService(provider: string): ILoggerService {
  const factory = loggerAdapterRegistry[provider] || loggerAdapterRegistry['default'];
  return factory();
}
