import type { ISensorService, SensorProviderType, SensorServiceOptions } from '../types/sensor-service';
import { SensorServiceFactory } from '../factory/sensor-service-factory';
import { getConfigService } from '@/core/services/infrastructure/config';

export interface SensorServiceConfig {
  environment?: string;
  name?: string;
  type?: SensorProviderType;
  options?: SensorServiceOptions;
}

export class SensorServiceRegistry {
  private static instance: SensorServiceRegistry;
  private registry: Record<string, ISensorService> = {};
  private static adapters: Record<string, () => ISensorService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new SensorServiceRegistry();
    return this.instance;
  }

  createService(config: Partial<SensorServiceConfig> = {}): ISensorService {
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
    let service: ISensorService;
    try {
      const adapter = SensorServiceRegistry.adapters[type!];
      service = adapter ? adapter() : SensorServiceFactory.createService({ type, options: config.options });
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = SensorServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : SensorServiceFactory.createService({ type: 'mock' });
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  getService(environment: string, name: string): ISensorService | undefined {
    return this.registry[`${environment}:${name}`];
  }
  clear() { this.registry = {}; }
  static registerAdapter(type: SensorProviderType, factory: () => ISensorService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: SensorProviderType): ISensorService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    SensorServiceRegistry.registerAdapter('mock', () => SensorServiceFactory.createService({ type: 'mock' }));
    SensorServiceRegistry.registerAdapter('web', () => SensorServiceFactory.createService({ type: 'web' }));
    SensorServiceRegistry.registerAdapter('capacitor', () => SensorServiceFactory.createService({ type: 'capacitor' }));
  }

  getProvider(
    type: SensorProviderType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: SensorServiceOptions
  ): () => ISensorService {
    return () => this.createService({ environment: type, name, type, options });
  }

  getDefaultService(_dataService?: unknown): ISensorService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
