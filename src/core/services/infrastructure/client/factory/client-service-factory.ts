// client/factory/client-service-factory.ts
import { ClientServiceRegistry, ClientProviderType } from '../registry/client-service-registry';
import type { ClientService } from '../service/client-service';

/**
 * 客户端服务工厂
 * 负责创建客户端服务实例
 */
export class ClientServiceFactory {
  /**
   * 创建客户端服务实例
   * @param type 客户端服务类型
   * @returns 客户端服务实例
   */
  public static createService(type: ClientProviderType = ClientProviderType.DEFAULT): ClientService {
    return ClientServiceRegistry.getAdapter(type);
  }

  /**
   * 创建默认客户端服务实例
   * @returns 客户端服务实例
   */
  public static createDefaultService(): ClientService {
    return this.createService(ClientProviderType.DEFAULT);
  }

  /**
   * 创建模拟客户端服务实例
   * @returns 客户端服务实例
   */
  public static createMockService(): ClientService {
    return this.createService(ClientProviderType.MOCK);
  }

  /**
   * 从配置创建客户端服务实例
   * @param config 配置对象
   * @returns 客户端服务实例
   */
  public static createServiceFromConfig(config: any): ClientService {
    const providerType = config?.provider || ClientProviderType.DEFAULT;
    return this.createService(providerType as ClientProviderType);
  }
}