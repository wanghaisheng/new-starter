import type { ILocationService, LocationServiceType, LocationServiceOptions } from '../types/location-service';
import { LocationServiceFactory } from '../factory/location-service-factory';
import { getConfigService } from '@/core/services/infrastructure/config';

export interface LocationServiceConfig {
  environment?: string;
  name?: string;
  type?: LocationServiceType;
  options?: LocationServiceOptions;
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
    const env = config.environment || getConfigService().get('NODE_ENV') || 'production';
    let type = config.type;
    if (!type) {
      if (
        env === 'test' ||
        env === 'development' ||
        getConfigService().get('NEXT_PUBLIC_USE_MOCK') === 'true'
      ) {
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
      const adapter = LocationServiceRegistry.adapters[type!];
      service = adapter ? adapter() : LocationServiceFactory.createService({ type, options: config.options });
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = LocationServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : LocationServiceFactory.createService({ type: 'mock' });
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  getService(environment: string, name: string): ILocationService | undefined {
    return this.registry[`${environment}:${name}`];
  }
  clear() { this.registry = {}; }
  static registerAdapter(type: LocationServiceType, factory: () => ILocationService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: LocationServiceType): ILocationService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    LocationServiceRegistry.registerAdapter('mock', () => LocationServiceFactory.createService({ type: 'mock' }));
    LocationServiceRegistry.registerAdapter('web', () => LocationServiceFactory.createService({ type: 'web' }));
    LocationServiceRegistry.registerAdapter('capacitor', () => LocationServiceFactory.createService({ type: 'capacitor' }));
  }

  getProvider(
    type: LocationServiceType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: LocationServiceOptions
  ): () => ILocationService {
    return () => this.createService({ environment: type, name, type, options });
  }

  getDefaultService(_dataService?: unknown): ILocationService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
