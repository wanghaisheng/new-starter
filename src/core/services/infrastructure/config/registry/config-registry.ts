// ConfigRegistry: 插件化注册表 + 工厂 + 适配器架构，符合服务设计规范
import { EnvConfigAdapter } from '@/core/services/infrastructure/config/adapters/env-config-adapter';
import { MockConfigAdapter } from '@/core/services/infrastructure/config/adapters/mock-config-adapter';
import { RemoteConfigAdapter } from '@/core/services/infrastructure/config/adapters/remote-config-adapter';
import { IConfigAdapter } from '@/core/services/infrastructure/config/types/config-adapter';
import { ConfigService } from '../service/config-service';
import { getConfigService } from '@/core/services/infrastructure/config';
// 移除 logger 相关依赖，防止循环依赖
// import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import { parseEnum } from '@/core/services/infrastructure/config/parse-enum';

// 可扩展 provider 类型枚举
export enum ConfigProviderType {
  ENV = 'env',
  MOCK = 'mock',
  REMOTE = 'remote',
  DEFAULT = 'default',
  // 可按需扩展 localfile/consul/etcd/ssm
}

// 插件注册表（如需扩展直接新增即可）
const configAdapterRegistry: Record<string, () => IConfigAdapter> = {
  [ConfigProviderType.ENV]: () => new EnvConfigAdapter(),
  [ConfigProviderType.MOCK]: () => new MockConfigAdapter(),
  [ConfigProviderType.REMOTE]: () => new RemoteConfigAdapter(),
  [ConfigProviderType.DEFAULT]: () => new EnvConfigAdapter(),
  // 'localfile': () => new LocalFileConfigAdapter(),
  // 'consul': () => new ConsulConfigAdapter(),
  // ...
};

/**
 * 导出 detectProvider 以支持插件化工厂等外部调用
 */
export function detectProvider(): ConfigProviderType {
  // 1. 浏览器端（NEXT_PUBLIC_ 变量）优先
  if (typeof window !== 'undefined') {
    const provider = (window as any).NEXT_PUBLIC_CONFIG_PROVIDER;
    if (provider) {
      return parseEnum(ConfigProviderType, provider, ConfigProviderType.DEFAULT, 'ConfigRegistry.detectProvider');
    }
  }
  // 2. 启动参数/环境变量
  const configService = getConfigService();
  const configProvider = configService.get?.('NEXT_PUBLIC_CONFIG_PROVIDER');
  if (configProvider) {
    return parseEnum(ConfigProviderType, configProvider, ConfigProviderType.DEFAULT, 'ConfigRegistry.detectProvider');
  }
  const configAdapter = configService.get?.('CONFIG_ADAPTER');
  if (configAdapter) {
    return parseEnum(ConfigProviderType, configAdapter, ConfigProviderType.DEFAULT, 'ConfigRegistry.detectProvider');
  }
  const envStage = configService.get?.('ENV_STAGE');
  const dataMode = configService.get?.('DATA_MODE');
  if (envStage === 'mock' || dataMode === 'offline-only') {
    return ConfigProviderType.MOCK;
  }
  if (envStage === 'remote') {
    return ConfigProviderType.REMOTE;
  }
  // 3. fallback
  return ConfigProviderType.ENV;
}

/**
 * 注册新的 config adapter（支持插件式扩展，重复注册自动覆盖并输出日志）
 */
export function registerConfigAdapter(name: string, factory: () => IConfigAdapter) {
  if (configAdapterRegistry[name]) {
    // getLoggerService().warn(`[ConfigRegistry] Adapter '${name}' 已注册，将被覆盖`);
  }
  configAdapterRegistry[name] = factory;
  // const logger = getLoggerService();
  // logger.info(`[ConfigRegistry] Registered new config adapter: ${name}`);
  // logger.debug(`[ConfigRegistry] Adapter factory:`, factory);
}

/**
 * 获取所有已注册的 config adapter 名称。
 */
export function getAvailableConfigAdapters(): string[] {
  return Object.keys(configAdapterRegistry);
}

/**
 * 获取指定 provider 的 config adapter 实例。
 * @param provider 配置源类型（env/mock/remote/default）
 */
export function getAdapter(provider?: ConfigProviderType | string) {
  const name = provider ? String(provider) : ConfigProviderType.DEFAULT;
  const factory = configAdapterRegistry[name];
  return factory ? factory() : undefined;
}

/**
 * 创建新的 ConfigService 实例（如需多实例/非单例场景）。
 * @param provider provider 名称
 */
export function createConfigService(provider: ConfigProviderType): ConfigService {
  const adapter = getAdapter(provider) || getAdapter(ConfigProviderType.DEFAULT);
  if (!adapter) throw new Error(`[ConfigRegistry] 无法获取 provider: ${provider} 的适配器实例`);
  return ConfigService.getInstance(adapter);
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

/**
 * 仅测试暴露：允许获取当前 ConfigService 的原始 adapter
 */
export function __test_getAdapter(provider?: ConfigProviderType | string): IConfigAdapter | undefined {
  const resolvedProvider = provider || detectProvider();
  const adapterFactory = configAdapterRegistry[resolvedProvider] || configAdapterRegistry[ConfigProviderType.DEFAULT];
  // 直接返回实例化的 adapter
  return adapterFactory();
}
