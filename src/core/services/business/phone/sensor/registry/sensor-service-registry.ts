import type { ISensorService, SensorServiceType } from '../types/sensor-service';
import { SensorServiceFactory } from '../factory/sensor-service-factory';

export interface SensorServiceConfig {
  environment?: string;
  name?: string;
  type?: SensorServiceType;
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
    let service: ISensorService;
    try {
      const adapter = SensorServiceRegistry.adapters[type];
      service = adapter ? adapter() : SensorServiceFactory.create(type);
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = SensorServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : SensorServiceFactory.create('mock');
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
  static registerAdapter(type: SensorServiceType, factory: () => ISensorService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: SensorServiceType): ISensorService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    SensorServiceRegistry.registerAdapter('web', () => SensorServiceFactory.create('web'));
    SensorServiceRegistry.registerAdapter('capacitor', () => SensorServiceFactory.create('capacitor'));
    SensorServiceRegistry.registerAdapter('mock', () => SensorServiceFactory.create('mock'));
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): ISensorService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
