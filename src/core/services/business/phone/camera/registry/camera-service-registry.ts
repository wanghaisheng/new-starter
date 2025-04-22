import type { ICameraService, CameraServiceType, CameraServiceOptions } from '../types/camera-service';
import { CameraServiceFactory } from '../factory/camera-service-factory';

export interface CameraServiceConfig {
  environment?: string;
  name?: string;
  type?: CameraServiceType;
  options?: CameraServiceOptions;
}

/**
 * 插件化注册表+工厂函数模式
 * 统一 getProvider 签名，支持多实例、运行时扩展、自动降级
 */
export class CameraServiceRegistry {
  private static instance: CameraServiceRegistry;
  private registry: Record<string, ICameraService> = {};
  private static adapters: Record<string, () => ICameraService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new CameraServiceRegistry();
    return this.instance;
  }

  /**
   * 统一工厂方法，支持自动环境判定与降级
   */
  createService(config: Partial<CameraServiceConfig> = {}): ICameraService {
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
    let service: ICameraService;
    try {
      const adapter = CameraServiceRegistry.adapters[type];
      service = adapter ? adapter() : CameraServiceFactory.createService({ type, options: config.options });
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = CameraServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : CameraServiceFactory.createService({ type: 'mock' });
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  getService(environment: string, name: string = 'default'): ICameraService | undefined {
    return this.registry[`${environment}:${name}`];
  }

  clear() { this.registry = {}; }

  /**
   * 插件化适配器注册
   */
  static registerAdapter(type: CameraServiceType, factory: () => ICameraService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: CameraServiceType): ICameraService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    this.registerAdapter('web', () => CameraServiceFactory.createService({ type: 'web' }));
    this.registerAdapter('capacitor', () => CameraServiceFactory.createService({ type: 'capacitor' }));
    this.registerAdapter('mock', () => CameraServiceFactory.createService({ type: 'mock' }));
  }

  /**
   * 统一 getProvider 签名，供 hooks/业务层调用
   */
  getProvider(
    type: CameraServiceType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: CameraServiceOptions
  ): () => ICameraService {
    return () => this.createService({ type, name, options });
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): ICameraService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
