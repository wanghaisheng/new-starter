// logger provider unified export
import type { LogLevel, ILoggerService } from '@/core/services/infrastructure/logger/types/logger-types';
import { LoggerRegistry, LoggerProviderType, createDefaultLogger, createLoggerFromConfig } from './registry/logger-registry';
import { getConfigService } from '@/core/services/infrastructure/config';

// 导出类型定义，便于外部使用
export type { LoggerProviderType };

// 导出适配器，便于外部使用
export * from '@/core/services/infrastructure/logger/adapters/winston-adapter';
export * from '@/core/services/infrastructure/logger/adapters/mock-adapter';
export * from '@/core/services/infrastructure/logger/adapters/pino-adapter';

// 全局单例实例
let loggerService: ILoggerService | undefined;
let loggerAdapter: ILoggerService | undefined;

/**
 * 异步初始化 loggerService
 * 用法：await initLogger();
 */
export async function initLogger(providerType?: LoggerProviderType) {
  // 如果配置服务已初始化，从配置服务获取日志provider类型
  let resolvedProviderType = providerType;
  
  try {
    const configService = getConfigService();
    // 优先使用传入的provider类型，其次从配置中获取
    if (!resolvedProviderType) {
      // 按优先级尝试获取日志provider类型
      resolvedProviderType = configService.get?.('NEXT_PUBLIC_LOGGER_PROVIDER') ||
                            configService.get?.('LOGGER_PROVIDER') ||
                            configService.get?.('LOGGER_ADAPTER');
    }
  } catch (e) {
    console.warn('[Logger] 配置服务未初始化，使用默认日志适配器');
  }

  // 创建日志服务实例
  loggerService = resolvedProviderType
    ? LoggerRegistry.getAdapter(resolvedProviderType)
    : createDefaultLogger();
  
  // 兼容旧逻辑，保存adapter引用
  loggerAdapter = loggerService;
  
  return { loggerService, loggerAdapter };
}

/**
 * 获取已初始化的 loggerService
 * 若未初始化会返回默认日志服务
 */
export function getLoggerService(): ILoggerService {
  if (!loggerService) {
    // 调试：打印调用栈，定位谁在 initLogger 前调用
    console.warn('[DEBUG] getLoggerService called before initLogger');
    console.warn(new Error('[DEBUG] getLoggerService stack trace').stack);
    
    // 创建默认日志服务作为兜底
    loggerService = createDefaultLogger();
    loggerAdapter = loggerService;
  }
  return loggerService;
}

/**
 * 获取已初始化的 loggerAdapter
 * 若未初始化会返回默认日志适配器
 */
export function getLoggerAdapter(): ILoggerService {
  if (!loggerAdapter) {
    return getLoggerService();
  }
  return loggerAdapter;
}

/**
 * 根据配置创建新的日志服务实例
 * @param config 日志配置
 */
export function createLoggerServiceFromConfig(config: any): ILoggerService {
  return createLoggerFromConfig(config);
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetLogger() {
  loggerService = undefined;
  loggerAdapter = undefined;
}
