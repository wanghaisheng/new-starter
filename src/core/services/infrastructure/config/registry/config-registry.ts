// ConfigRegistry: 插件化注册表 + 工厂 + 适配器架构，符合服务设计规范
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';
import { EnvConfigAdapter } from '@/core/services/infrastructure/config/adapters/env-config-adapter';
import { MockConfigAdapter } from '@/core/services/infrastructure/config/adapters/mock-config-adapter';
import { RemoteConfigAdapter } from '@/core/services/infrastructure/config/adapters/remote-config-adapter';
import { IConfigAdapter } from '@/core/services/infrastructure/config/types/config-adapter';
// 新增日志服务依赖
import { getLoggerService } from '@/core/services/infrastructure/logger/registry/logger-registry';

// 插件注册表
const configAdapterRegistry: Record<string, () => IConfigAdapter> = {
  'env': () => new EnvConfigAdapter(),
  'mock': () => new MockConfigAdapter(),
  'remote': () => new RemoteConfigAdapter(),
  'default': () => new EnvConfigAdapter(),
};

let instance: ConfigService | undefined;
let lastProvider: string | undefined;

/**
 * 自动检测当前环境应使用的 provider 名称。
 * 优先级：CONFIG_ADAPTER > ENV_STAGE/mock > DATA_MODE/offline-only > remote > env
 */
function detectProvider(): string {
  // 1. 启动参数/环境变量优先
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.CONFIG_ADAPTER) return process.env.CONFIG_ADAPTER;
    if (process.env.ENV_STAGE === 'mock' || process.env.DATA_MODE === 'offline-only') return 'mock';
    if (process.env.ENV_STAGE === 'remote') return 'remote';
  }
  // 2. 浏览器端（NEXT_PUBLIC_ 变量）
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if (window.CONFIG_ADAPTER) return window.CONFIG_ADAPTER;
    // @ts-ignore
    if (window.ENV_STAGE === 'mock' || window.DATA_MODE === 'offline-only') return 'mock';
    // @ts-ignore
    if (window.ENV_STAGE === 'remote') return 'remote';
  }
  return 'env';
}

/**
 * 动态注册新的 config adapter（插件/适配器）。
 */
export function registerConfigAdapter(name: string, factory: () => IConfigAdapter) {
  configAdapterRegistry[name] = factory;
  // 日志记录注册事件
  const logger = getLoggerService();
  logger.info(`[ConfigRegistry] Registered new config adapter: ${name}`);
  logger.debug(`[ConfigRegistry] Adapter factory: ${factory}`);
}

/**
 * 获取所有已注册的 config adapter 名称。
 */
export function getAvailableConfigAdapters(): string[] {
  const adapters = Object.keys(configAdapterRegistry);
  getLoggerService().debug(`[ConfigRegistry] Available adapters: ${adapters.join(', ')}`);
  return adapters;
}

/**
 * 获取全局唯一 ConfigService 实例，支持 provider 热切换和插件式扩展。
 * @param provider 配置源类型（env/mock/remote/default），如不传则自动检测。
 */
export function getConfigService(provider?: string): ConfigService {
  const resolvedProvider = provider || detectProvider();
  const logger = getLoggerService();
  if (!instance || resolvedProvider !== lastProvider) {
    const adapterFactory = configAdapterRegistry[resolvedProvider] || configAdapterRegistry['default'];
    logger.warn(`[ConfigService] Provider change detected: ${lastProvider ?? 'undefined'} -> ${resolvedProvider}`);
    instance = ConfigService.getInstance(adapterFactory());
    lastProvider = resolvedProvider;
    // 日志服务应用：记录 provider 切换和初始化
    logger.info(`[ConfigService] Using provider: ${resolvedProvider}`);
    logger.debug(`[ConfigService] Provider factory: ${adapterFactory}`);
    if (!configAdapterRegistry[resolvedProvider]) {
      logger.error(`[ConfigService] Unknown provider: ${resolvedProvider}, fallback to default.`);
    }
    if (typeof window !== 'undefined') {
      // 控制台提示当前 provider，便于调试
      // @ts-ignore
      if (window.__CONFIG_DEBUG__ || process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[ConfigService] Using provider:', resolvedProvider);
      }
    }
  } else {
    logger.debug(`[ConfigService] Reused existing instance for provider: ${resolvedProvider}`);
  }
  return instance;
}

/**
 * 创建新的 ConfigService 实例（如需多实例/非单例场景）。
 * @param provider provider 名称
 */
export function createConfigService(provider: string): ConfigService {
  const adapterFactory = configAdapterRegistry[provider] || configAdapterRegistry['default'];
  return ConfigService.getInstance(adapterFactory());
}

/**
 * 移除已注册的 config adapter。
 * @param name config adapter 名称
 */
export function unregisterConfigAdapter(name: string) {
  delete configAdapterRegistry[name];
}

/**
 * 检查 config adapter 是否已注册。
 * @param name config adapter 名称
 */
export function isConfigAdapterRegistered(name: string): boolean {
  return !!configAdapterRegistry[name];
}

/**
 * 获取 config adapter 实例。
 * @param name config adapter 名称
 */
export function getConfigAdapter(name: string): IConfigAdapter | undefined {
  const adapterFactory = configAdapterRegistry[name];
  return adapterFactory ? adapterFactory() : undefined;
}
