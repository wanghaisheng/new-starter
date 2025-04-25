// config/index.ts
import { createConfigAdapter } from './factory/config-factory';
import { ConfigService } from './service/config-service';

let configService: ConfigService | undefined;
let configAdapter: any;

/**
 * 异步初始化 configService 和 configAdapter
 * 用法：await initConfig();
 */
export async function initConfig() {
  configAdapter = await createConfigAdapter(undefined, undefined);
  if (typeof configAdapter.initialize === 'function') {
    await configAdapter.initialize(); // 确保环境变量同步到 store
  }
  configService = new ConfigService(configAdapter); // 每次都 new 新实例，避免单例缓存
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
