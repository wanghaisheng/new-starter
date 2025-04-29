// config/index.ts
import { createConfigService, ConfigProviderType } from './registry/config-registry';
import type { ConfigService } from './service/config-service';
import type { IConfigAdapter } from './types/config-adapter';

let configService: ConfigService | undefined;
let configAdapter: IConfigAdapter | undefined;

/**
 * 异步初始化 configService 和 configAdapter
 * 用法：await initConfig();
 */
export async function initConfig(providerType?: ConfigProviderType) {
  // 通过工厂方法创建 ConfigService 实例（自动选择适配器/来源）
  configService = createConfigService(providerType ?? ConfigProviderType.DEFAULT);
  // 兼容旧逻辑，如需 adapter 可从 configService 取出
  configAdapter = (configService as any)?.adapter ?? undefined;
  return { configService, configAdapter };
}

/**
 * 获取已初始化的 configService
 * 若未初始化会抛出异常
 */
export function getConfigService() {
  if (!configService) {
    // 调试：打印调用栈和环境变量，定位谁在 initConfig 前调用
    console.error('[DEBUG] getConfigService called before initConfig');
    console.error(new Error('[DEBUG] getConfigService stack trace').stack);
    console.error('[DEBUG] process.env:', process.env);
    throw new Error('ConfigService not initialized, call initConfig() first.');
  }
  return configService;
}

/**
 * 获取已初始化的 configAdapter
 * 若未初始化会抛出异常
 */
export function getConfigAdapter() {
  if (!configAdapter) throw new Error('ConfigAdapter not initialized, call initConfig() first.');
  return configAdapter;
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetConfig() {
  configService = undefined;
  configAdapter = undefined;
}
