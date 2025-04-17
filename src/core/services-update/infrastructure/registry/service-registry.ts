import { IInfrastructureService, InfrastructureServiceType } from '../types';
import { ServiceConfig } from '../../types';

/**
 * 服务注册表
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, IInfrastructureService> = new Map();
  private providers: Map<InfrastructureServiceType, new (config: ServiceConfig) => IInfrastructureService> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 注册服务提供者
   */
  registerProvider(type: InfrastructureServiceType, provider: new (config: ServiceConfig) => IInfrastructureService): void {
    this.providers.set(type, provider);
  }

  /**
   * 获取服务提供者
   */
  getProvider(type: InfrastructureServiceType): new (config: ServiceConfig) => IInfrastructureService {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`No provider registered for service type: ${type}`);
    }
    return provider;
  }

  /**
   * 创建服务实例
   */
  createService(type: InfrastructureServiceType, config: ServiceConfig): IInfrastructureService {
    const Provider = this.getProvider(type);
    const service = new Provider(config);
    this.services.set(type, service);
    return service;
  }

  /**
   * 获取服务实例
   */
  getService(type: InfrastructureServiceType): IInfrastructureService | undefined {
    return this.services.get(type);
  }

  /**
   * 移除服务实例
   */
  async removeService(type: InfrastructureServiceType): Promise<void> {
    const service = this.services.get(type);
    if (service) {
      await service.dispose();
      this.services.delete(type);
    }
  }

  /**
   * 移除所有服务实例
   */
  async removeAllServices(): Promise<void> {
    const services = Array.from(this.services.entries());
    for (const [type] of services) {
      await this.removeService(type as InfrastructureServiceType);
    }
  }

  /**
   * 检查服务是否存在
   */
  hasService(type: InfrastructureServiceType): boolean {
    return this.services.has(type);
  }

  /**
   * 获取所有服务实例
   */
  getAllServices(): IInfrastructureService[] {
    return Array.from(this.services.values());
  }
} 