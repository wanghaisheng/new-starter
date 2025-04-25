// config-factory.ts
import type { IConfigAdapter } from '../types/config-adapter';
import { ConfigService } from '../service/config-service';
import { EnvConfigAdapter } from '../adapters/env-config-adapter';
import { MockConfigAdapter } from '../adapters/mock-config-adapter';
import { RemoteConfigAdapter } from '../adapters/remote-config-adapter';

// 可扩展 provider 类型枚举
export enum ConfigProviderType {
  ENV = 'env',
  MOCK = 'mock',
  REMOTE = 'remote',
  DEFAULT = 'default',
}

// 插件注册表（如需扩展直接新增即可）
const configAdapterRegistry: Record<string, () => IConfigAdapter> = {
  [ConfigProviderType.ENV]: () => new EnvConfigAdapter(),
  [ConfigProviderType.MOCK]: () => new MockConfigAdapter(),
  [ConfigProviderType.REMOTE]: () => new RemoteConfigAdapter(),
  [ConfigProviderType.DEFAULT]: () => new EnvConfigAdapter(),
};

let instance: ConfigService | undefined;
let lastProvider: ConfigProviderType | undefined;

/**
 * 注册新的 config adapter（支持插件式扩展，重复注册自动覆盖）
 */
export function registerConfigAdapter(name: string, factory: () => IConfigAdapter) {
  configAdapterRegistry[name] = factory;
}

/**
 * 获取所有已注册的 config adapter 名称。
 */
export function getAvailableConfigAdapters(): string[] {
  return Object.keys(configAdapterRegistry);
}

/**
 * 检查 config adapter 是否已注册。
 */
export function isConfigAdapterRegistered(name: string): boolean {
  return !!configAdapterRegistry[name];
}

/**
 * 移除已注册的 config adapter。
 */
export function unregisterConfigAdapter(name: string) {
  delete configAdapterRegistry[name];
}

/**
 * 获取 config adapter 实例。
 */
export function getConfigAdapter(name: string): IConfigAdapter | undefined {
  const factory = configAdapterRegistry[name];
  return factory ? factory() : undefined;
}

/**
 * 获取全局唯一 ConfigService 实例，支持 provider 热切换和插件式扩展。
 * @param provider 配置源类型（env/mock/remote/default），如不传则自动检测。
 */
export function getConfigService(provider?: ConfigProviderType): ConfigService {
  const resolvedProvider = provider || detectProvider();
  const adapter = getConfigAdapter(resolvedProvider) || getConfigAdapter(ConfigProviderType.DEFAULT);
  if (!adapter) throw new Error(`[ConfigFactory] 无法获取 provider: ${resolvedProvider} 的适配器实例`);
  if (!instance || resolvedProvider !== lastProvider) {
    instance = ConfigService.getInstance(adapter);
    lastProvider = resolvedProvider;
  }
  return instance;
}

/**
 * 仅测试暴露：允许获取当前 ConfigService 的原始 adapter
 */
export function __test_getAdapter(provider?: ConfigProviderType | string): IConfigAdapter | undefined {
  const name = provider ? String(provider) : ConfigProviderType.DEFAULT;
  return getConfigAdapter(name);
}

/**
 * 自动探测 provider 类型，优先级：window > process.env > fallback
 */
export function detectProvider(): ConfigProviderType {
  if (typeof window !== 'undefined') {
    const provider = (window as any).NEXT_PUBLIC_CONFIG_PROVIDER;
    if (provider) {
      return (Object.values(ConfigProviderType) as string[]).includes(provider)
        ? (provider as ConfigProviderType)
        : ConfigProviderType.DEFAULT;
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_CONFIG_PROVIDER) {
      const p = process.env.NEXT_PUBLIC_CONFIG_PROVIDER;
      return (Object.values(ConfigProviderType) as string[]).includes(p)
        ? (p as ConfigProviderType)
        : ConfigProviderType.DEFAULT;
    }
    if (process.env.CONFIG_ADAPTER) {
      const p = process.env.CONFIG_ADAPTER;
      return (Object.values(ConfigProviderType) as string[]).includes(p)
        ? (p as ConfigProviderType)
        : ConfigProviderType.DEFAULT;
    }
    if (process.env.ENV_STAGE === 'mock' || process.env.DATA_MODE === 'offline-only') {
      return ConfigProviderType.MOCK;
    }
    if (process.env.ENV_STAGE === 'remote') {
      return ConfigProviderType.REMOTE;
    }
  }
  return ConfigProviderType.ENV;
}

interface LoggerLike {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * 插件化适配器工厂：
 * 1. 默认从本地 .env 文件或 process.env 读取环境变量（ENV provider，详见 docs/guides/environment-variables.md）
 * 2. 若 provider=remote，则重新读取/刷新环境变量（如有必要，可调用专门的 reloadEnv 或相关逻辑）
 * 3. 其余 provider 走注册表
 * 禁止在 config 初始化链路内直接调用 logger！如需日志功能，请在 config 初始化后注入 logger。
 * @param provider 指定 provider 类型或字符串，默认自动探测
 * @param logger 可选日志对象，未传则降级为 noop
 * @throws 无法获取 provider 实例时抛出异常
 */
export async function createConfigAdapter(
  provider?: ConfigProviderType | string,
  logger?: LoggerLike
): Promise<IConfigAdapter> {
  let log: LoggerLike = logger || { info: () => {}, warn: () => {}, error: () => {} };
  let resolvedProvider = provider ? String(provider) : detectProvider();
  const available = getAvailableConfigAdapters();
  let adapter: IConfigAdapter | undefined;

  // 1. 默认 ENV provider 先读取本地 .env 或 process.env
  if (!provider || resolvedProvider === ConfigProviderType.ENV) {
    // 可选：此处可插入 dotenv/config 逻辑以确保 .env 文件已加载
    // require('dotenv').config(); // 若未全局加载
    adapter = getConfigAdapter(ConfigProviderType.ENV);
    log.info('[ConfigFactory] 使用本地环境变量 ENV provider 初始化配置服务');
  } else if (resolvedProvider === ConfigProviderType.REMOTE) {
    // 2. remote provider 可选刷新本地环境变量后再初始化
    // 可选：重新 require('dotenv').config() 或调用自定义 reloadEnv()
    // require('dotenv').config();
    adapter = getConfigAdapter(ConfigProviderType.REMOTE);
    log.info('[ConfigFactory] 使用 REMOTE provider，已刷新本地环境变量并初始化配置服务');
  } else {
    // 3. 其它 provider
    adapter = getConfigAdapter(resolvedProvider);
    log.info(`[ConfigFactory] 使用自定义 provider: ${resolvedProvider}`);
  }

  if (!available.includes(resolvedProvider)) {
    log.warn(`[ConfigFactory] Provider '${resolvedProvider}' 未注册，已注册: [${available.join(', ')}]，将使用 fallback: default`);
    adapter = getConfigAdapter(ConfigProviderType.DEFAULT);
  }

  if (!adapter) {
    log.error(`[ConfigFactory] 无法获取 provider: ${resolvedProvider} 的适配器实例！`);
    throw new Error(`ConfigFactory: 无法获取 provider: ${resolvedProvider} 的适配器实例`);
  }
  return adapter as IConfigAdapter;
}

/**
 * 获取所有已注册的 config provider 名称
 */
export function getConfigProviders(): string[] {
  return getAvailableConfigAdapters();
}
