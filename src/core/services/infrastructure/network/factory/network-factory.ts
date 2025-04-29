// network-factory.ts
import type { INetworkService, NetworkProviderType, NetworkConfig } from '../types/network-types';
import { NetworkRegistry } from '../registry/network-registry';
import { getConfigService } from '@/core/services/infrastructure/config';
import { CONFIG_KEYS } from '@/core/services/infrastructure/config/config-keys';

/**
 * 插件化 Network 工厂，变量优先级解析后统一调用注册表。
 * provider/source/options 优先级：参数 > config > 配置服务 > 环境变量 > 默认。
 */
export class NetworkFactory {
  static createNetworkService(config: NetworkConfig = {}): INetworkService {
    let provider: NetworkProviderType;
    let configService: any = undefined;
    try {
      configService = getConfigService?.();
    } catch (e) {
      configService = undefined;
    }
    provider =
      config.provider ||
      (configService?.get?.(CONFIG_KEYS.NETWORK_PROVIDER)) ||
      getConfigService().get(CONFIG_KEYS.NETWORK_PROVIDER) ||
      getConfigService().get(CONFIG_KEYS.NEXT_PUBLIC_NETWORK_PROVIDER) ||
      'default';

    if (!provider) provider = 'default';

    const service = NetworkRegistry.getAdapter(provider, config) || NetworkRegistry.getAdapter('default', config);
    if (!service) throw new Error(`[NetworkFactory] 未找到有效 network provider: ${provider}`);
    return service;
  }

  static registerAdapter(provider: NetworkProviderType, factory: (config?: NetworkConfig) => INetworkService) {
    NetworkRegistry.registerAdapter(provider, factory);
  }
}
