import { IService, ServiceConfig } from '../../types';
import { IInfrastructureService, InfrastructureServiceConfig } from '../types';
import { logger } from '../../lib/logger';

/**
 * 基础服务工厂类
 */
export abstract class BaseServiceFactory<T extends IInfrastructureService> {
  protected services: Map<string, T> = new Map();
  protected config: InfrastructureServiceConfig;

  constructor(config: InfrastructureServiceConfig) {
    this.config = config;
  }

  /**
   * 创建服务实例
   */
  abstract createService(config: InfrastructureServiceConfig): T;

  /**
   * 获取服务实例
   */
  getService(id: string): T | undefined {
    return this.services.get(id);
  }

  /**
   * 销毁服务实例
   */
  async disposeService(id: string): Promise<void> {
    const service = this.services.get(id);
    if (service) {
      await service.dispose();
      this.services.delete(id);
    }
  }

  /**
   * 销毁所有服务实例
   */
  async disposeAll(): Promise<void> {
    const services = Array.from(this.services.entries());
    for (const [id] of services) {
      await this.disposeService(id);
    }
  }

  /**
   * 获取服务类型
   */
  protected abstract getServiceType(): string;
}

/**
 * 服务工厂基类
 */
export abstract class BaseFactory<T extends IService> {
  protected instances: Map<string, T> = new Map();
  protected initialized: boolean = false;

  /**
   * 创建服务实例
   */
  public abstract createService(config: ServiceConfig): Promise<T>;

  /**
   * 获取服务实例
   */
  public getInstance(name: string): T | undefined {
    return this.instances.get(name);
  }

  /**
   * 获取所有服务实例
   */
  public getAllInstances(): T[] {
    return Array.from(this.instances.values());
  }

  /**
   * 移除服务实例
   */
  public removeInstance(name: string): void {
    const instance = this.instances.get(name);
    if (instance) {
      instance.dispose();
      this.instances.delete(name);
      logger.info(`Service instance '${name}' removed successfully`);
    } else {
      logger.warn(`Service instance '${name}' not found`);
    }
  }

  /**
   * 清空所有服务实例
   */
  public async clearInstances(): Promise<void> {
    const instances = Array.from(this.instances.values());
    for (const instance of instances) {
      await instance.dispose();
    }
    this.instances.clear();
    logger.info('All service instances cleared');
  }

  /**
   * 初始化工厂
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info('Factory initialized');
  }

  /**
   * 释放工厂资源
   */
  public async dispose(): Promise<void> {
    await this.clearInstances();
    this.initialized = false;
    logger.info('Factory disposed');
  }

  /**
   * 检查工厂是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
} 