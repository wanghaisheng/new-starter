import type { ILocationService, LocationServiceType } from '../types/location-service';
import { LocationServiceFactory } from '../factory/location-service-factory';

export interface LocationServiceConfig {
  environment?: string;
  name?: string;
  type?: LocationServiceType;
}

export class LocationServiceRegistry {
  private static instance: LocationServiceRegistry;
  private registry: Record<string, ILocationService> = {};
  private static adapters: Record<string, () => ILocationService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new LocationServiceRegistry();
    return this.instance;
  }

  createService(config: Partial<LocationServiceConfig> = {}): ILocationService {
    // 自动判定环境并降级
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
      service = adapter ? adapter() : LocationServiceFactory.create(type);
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = LocationServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : LocationServiceFactory.create('mock');
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  /**
   * provider 插件式注册与获取（推荐 hooks 场景使用）
   * @param type mock/remote/hybrid
   * @param name 实例名（默认 default）
   * @returns () => ILocationService
   */
  static getProvider(type: string = 'remote', name: string = 'default'): (() => ILocationService) {
    return () => LocationServiceRegistry.getInstance().createService({ type, name });
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerProvider(type: string, factory: (name?: string) => ILocationService): void {
    this.adapters[type] = factory;
  }
  static getProviderFactory(type: string): ((name?: string) => ILocationService) | undefined {
    return this.adapters[type];
  }
  static unregisterProvider(type: string): void {
    delete this.adapters[type];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(): ILocationService {
    return (
      this.createService({ type: 'remote', name: 'default' }) ||
      this.createService({ type: 'hybrid', name: 'default' }) ||
      this.createService({ type: 'mock', name: 'default' })
    );
  }
}
