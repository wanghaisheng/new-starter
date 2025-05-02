// client/index.ts
import { ClientServiceRegistry, ClientProviderType } from './registry/client-service-registry';
import type { ClientService } from './service/client-service';
import type { IClientAdapter } from './types/client-adapter';
import { getConfigService } from '@/core/services/infrastructure/config';
import { getLoggerService } from '@/core/services/infrastructure/logger';

// 全局单例实例
let clientService: ClientService | undefined;
let clientAdapter: IClientAdapter | undefined;

/**
 * 异步初始化 clientService 和 clientAdapter
 * 用法：await initClientService();
 */
export async function initClientService(providerType?: ClientProviderType) {
  const logger = getLoggerService();
  logger.info('[ClientService] 初始化客户端服务...');
  
  try {
    // 从配置服务获取客户端服务类型（如果有）
    const configService = getConfigService();
    const resolvedProviderType = providerType || 
                              configService.get('NEXT_PUBLIC_CLIENT_PROVIDER') ||
                              configService.get('CLIENT_ADAPTER') ||
                              ClientProviderType.DEFAULT;
    
    // 通过工厂方法创建 ClientService 实例（自动选择适配器/来源）
    clientService = ClientServiceRegistry.getAdapter(resolvedProviderType);
    // 兼容旧逻辑，如需 adapter 可从 clientService 取出
    clientAdapter = (clientService as any)?.adapter ?? undefined;
    
    logger.info(`[ClientService] 客户端服务初始化完成，使用适配器: ${resolvedProviderType}`);
  } catch (err) {
    logger.error('[ClientService] 客户端服务初始化失败', err);
    throw err;
  }
  
  return { clientService, clientAdapter };
}

/**
 * 获取已初始化的 clientService
 * 若未初始化会抛出异常
 */
export function getClientService() {
  if (!clientService) {
    // 调试：打印调用栈和环境变量，定位谁在 initClientService 前调用
    console.error('[DEBUG] getClientService called before initClientService');
    console.error(new Error('[DEBUG] getClientService stack trace').stack);
    console.error('[DEBUG] process.env:', process.env);
    throw new Error('ClientService not initialized, call initClientService() first.');
  }
  return clientService;
}

/**
 * 获取已初始化的 clientAdapter
 * 若未初始化会抛出异常
 */
export function getClientAdapter() {
  if (!clientAdapter) throw new Error('ClientAdapter not initialized, call initClientService() first.');
  return clientAdapter;
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetClientService() {
  clientService = undefined;
  clientAdapter = undefined;
}