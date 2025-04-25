// config-factory.ts
import { IConfigAdapter } from '../types/config-adapter';
import {
  getLoggerService,
} from '@/core/services/infrastructure/logger/registry/logger-registry';
import {
  detectProvider,
  ConfigProviderType,
  getAvailableConfigAdapters,
  registerConfigAdapter,
  __test_getAdapter,
} from '../registry/config-registry';

/**
 * 插件化适配器工厂：从注册表动态获取 provider 实现，支持类型安全、日志、插件扩展。
 * 支持多 provider 热切换、fallback、动态注册。
 */
export function createConfigAdapter(provider?: ConfigProviderType | string): IConfigAdapter {
  const logger = getLoggerService();
  // 统一 provider 为字符串，避免枚举类型不一致
  const resolvedProvider = provider ? String(provider) : detectProvider();
  const available = getAvailableConfigAdapters();
  if (!available.includes(resolvedProvider)) {
    logger.warn(`[ConfigFactory] Provider '${resolvedProvider}' 未注册，已注册: [${available.join(', ')}]，将使用 fallback: default`);
  }
  // 通过 config-registry 的 __test_getAdapter 统一获取实例，保证与服务注册表一致
  const adapter = __test_getAdapter(resolvedProvider) || __test_getAdapter(ConfigProviderType.DEFAULT);
  if (!adapter) {
    logger.error(`[ConfigFactory] 无法获取 provider: ${resolvedProvider} 的适配器实例！`);
    throw new Error(`ConfigFactory: 无法获取 provider: ${resolvedProvider} 的适配器实例`);
  }
  logger.info(`[ConfigFactory] Using provider: ${resolvedProvider}`);
  return adapter as IConfigAdapter;
}

// 可选：暴露所有可用 provider 供前端选择
export function getConfigProviders(): string[] {
  return getAvailableConfigAdapters();
}
