// client/registry/client-service-registry.ts
import type { ClientService } from '../service/client-service';
import type { IClientAdapter } from '../types/client-adapter';

/**
 * 客户端服务提供者类型枚举
 */
export enum ClientProviderType {
  DEFAULT = 'default',
  MOCK = 'mock',
  LOCAL = 'local',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

/**
 * 客户端服务注册表
 * 负责管理所有客户端服务适配器
 */
export class ClientServiceRegistry {
  private static adapters = new Map<string, () => ClientService>();
  private static instance: ClientService | undefined;

  /**
   * 注册适配器
   * @param type 适配器类型
   * @param factory 适配器工厂函数
   */
  public static registerAdapter(type: string, factory: () => ClientService) {
    this.adapters.set(type, factory);
  }

  /**
   * 获取适配器
   * @param type 适配器类型
   * @returns 适配器实例
   */
  public static getAdapter(type: string = ClientProviderType.DEFAULT): ClientService {
    // 如果已有实例，直接返回
    if (this.instance) return this.instance;

    // 获取适配器工厂
    const factory = this.adapters.get(type) || this.adapters.get(ClientProviderType.DEFAULT);
    if (!factory) {
      throw new Error(`ClientService adapter not found for type: ${type}`);
    }

    // 创建适配器实例
    this.instance = factory();
    return this.instance;
  }

  /**
   * 获取单例实例
   * @returns 客户端服务实例
   */
  public static getInstance(): ClientService {
    return this.getAdapter();
  }

  /**
   * 注册所有适配器
   * 在应用启动时调用
   */
  public static registerAllAdapters() {
    // 默认适配器
    this.registerAdapter(ClientProviderType.DEFAULT, () => {
      // 导入默认客户端适配器
      const { DefaultClientAdapter } = require('../adapters/default-adapter');
      // 创建默认客户端服务
      return new DefaultClientAdapter();
    });

    // Mock适配器
    this.registerAdapter(ClientProviderType.MOCK, () => {
      // 导入模拟客户端适配器
      const { MockClientAdapter } = require('../adapters/mock-adapter');
      // 创建模拟客户端服务
      return new MockClientAdapter();
    });

    // 可以注册更多适配器...
  }

  /**
   * 重置注册表（测试用）
   */
  public static reset() {
    this.instance = undefined;
  }
}

/**
 * 创建默认客户端服务
 * @returns 客户端服务实例
 */
export function createDefaultClientService(): ClientService {
  return ClientServiceRegistry.getAdapter(ClientProviderType.DEFAULT);
}

/**
 * 从配置创建客户端服务
 * @param config 配置对象
 * @returns 客户端服务实例
 */
export function createClientServiceFromConfig(config: any): ClientService {
  const providerType = config?.provider || ClientProviderType.DEFAULT;
  return ClientServiceRegistry.getAdapter(providerType);
}