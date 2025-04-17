import { IService, IServiceRegistry, ServiceConfig } from '@/core/services-update/types';
import { IInfrastructureService } from '@/core/services-update/infrastructure/types';
import { logger } from '@/core/lib/logger';

/**
 * 服务注册表基类
 */
export abstract class BaseRegistry<T extends IService> {
  protected services: Map<string, T> = new Map();
  protected initialized: boolean = false;

  /**
   * 注册服务
   */
  public registerService(name: string, service: T): void {
    if (this.services.has(name)) {
      logger.warn(`Service '${name}' is already registered. Overwriting...`);
    }
    this.services.set(name, service);
    logger.info(`Service '${name}' registered successfully`);
  }

  /**
   * 获取服务
   */
  public getService(name: string): T | undefined {
    return this.services.get(name);
  }

  /**
   * 获取所有服务
   */
  public getAllServices(): T[] {
    return Array.from(this.services.values());
  }

  /**
   * 移除服务
   */
  public removeService(name: string): void {
    if (this.services.delete(name)) {
      logger.info(`Service '${name}' removed successfully`);
    } else {
      logger.warn(`Service '${name}' not found`);
    }
  }

  /**
   * 清空所有服务
   */
  public clearServices(): void {
    this.services.clear();
    logger.info('All services cleared');
  }

  /**
   * 初始化注册表
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info('Registry initialized');
  }

  /**
   * 释放注册表资源
   */
  public async dispose(): Promise<void> {
    this.services.clear();
    this.initialized = false;
    logger.info('Registry disposed');
  }

  /**
   * 检查注册表是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * 基础服务注册表
 */
export abstract class BaseServiceRegistry<T extends IInfrastructureService> implements IServiceRegistry<T> {
  protected providers: Map<string, new (config: ServiceConfig) => T> = new Map();

  /**
   * 注册服务提供者
   */
  registerProvider(type: string, provider: new (config: ServiceConfig) => T): void {
    this.providers.set(type, provider);
  }

  /**
   * 注销服务提供者
   */
  unregisterProvider(type: string): void {
    this.providers.delete(type);
  }

  /**
   * 获取服务提供者
   */
  getProvider(type: string): (new (config: ServiceConfig) => T) | null {
    return this.providers.get(type) || null;
  }

  /**
   * 获取所有注册的提供者类型
   */
  getProviderTypes(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查提供者是否存在
   */
  hasProvider(type: string): boolean {
    return this.providers.has(type);
  }

  /**
   * 创建服务实例
   */
  createService(type: string, config: ServiceConfig): T {
    const Provider = this.getProvider(type);
    if (!Provider) {
      throw new Error(`Service provider of type '${type}' not found`);
    }
    return new Provider(config);
  }
} 