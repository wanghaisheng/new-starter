import type { ILocationService, LocationServiceType, LocationServiceOptions } from '../types/location-service';
import { LocationServiceFactory } from '../factory/location-service-factory';

export interface LocationServiceConfig {
  environment?: string;
  name?: string;
  type?: LocationServiceType;
  options?: LocationServiceOptions;
}

/**
 * 插件化注册表+工厂函数模式
 * 统一 getProvider 签名，支持多实例、运行时扩展、自动降级
 */
export class LocationServiceRegistry {
  private static instance: LocationServiceRegistry;
  private registry: Record<string, ILocationService> = {};
  private static adapters: Record<string, () => ILocationService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new LocationServiceRegistry();
    return this.instance;
  }

  /**
   * 统一工厂方法，支持自动环境判定与降级
   */
  createService(config: Partial<LocationServiceConfig> = {}): ILocationService {
    const env = config.environment || (typeof process !== 'undefined' && process.env.NODE_ENV) || 'production';
    let type = config.type;
    if (!type) {
      if (env === 'test' || env === 'development' || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true')) {
        type = 'mock';
      } else {
        type = 'web';
      }
    }
    const name = config.name || 'default';
    const key = `${env}:${name}`;
    if (this.registry[key]) return this.registry[key];
    let service: ILocationService;
    try {
      const adapter = LocationServiceRegistry.adapters[type];
      service = adapter ? adapter() : LocationServiceFactory.createService({ type, options: config.options });
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = LocationServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : LocationServiceFactory.createService({ type: 'mock', options: {} });
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  getService(environment: string, name: string = 'default'): ILocationService | undefined {
    return this.registry[`${environment}:${name}`];
  }

  clear() { this.registry = {}; }

  /**
   * 插件化适配器注册
   */
  static registerAdapter(type: LocationServiceType, factory: () => ILocationService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: LocationServiceType): ILocationService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    this.registerAdapter('web', () => LocationServiceFactory.createService({ type: 'web', options: {} }));
    this.registerAdapter('capacitor', () => LocationServiceFactory.createService({ type: 'capacitor', options: {} }));
    this.registerAdapter('mock', () => LocationServiceFactory.createService({ type: 'mock', options: {} }));
  }

  /**
   * 统一 getProvider 签名，供 hooks/业务层调用
   */
  getProvider(
    type: LocationServiceType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: LocationServiceOptions
  ): () => ILocationService {
    return () => this.createService({ type, name, options });
  }

  /**
   * 获取默认实例
   */
  getDefaultService(_dataService?: unknown): ILocationService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock', options: {} })
    );
  }
}
