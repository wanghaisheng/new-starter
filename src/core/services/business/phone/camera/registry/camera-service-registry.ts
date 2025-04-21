import type { ICameraService, CameraServiceType } from '../types/camera-service';
import { CameraServiceFactory } from '../factory/camera-service-factory';

export interface CameraServiceConfig {
  environment?: string;
  name?: string;
  type?: CameraServiceType;
}

export class CameraServiceRegistry {
  private static instance: CameraServiceRegistry;
  private registry: Record<string, ICameraService> = {};
  private static adapters: Record<string, () => ICameraService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new CameraServiceRegistry();
    return this.instance;
  }

  createService(config: Partial<CameraServiceConfig> = {}): ICameraService {
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
    let service: ICameraService;
    try {
      const adapter = CameraServiceRegistry.adapters[type];
      service = adapter ? adapter() : CameraServiceFactory.create(type);
    } catch (e) {
      // web/capacitor 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = CameraServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : CameraServiceFactory.create('mock');
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
  static registerAdapter(type: CameraServiceType, factory: () => ICameraService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: CameraServiceType): ICameraService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    CameraServiceRegistry.registerAdapter('web', () => CameraServiceFactory.create('web'));
    CameraServiceRegistry.registerAdapter('capacitor', () => CameraServiceFactory.create('capacitor'));
    CameraServiceRegistry.registerAdapter('mock', () => CameraServiceFactory.create('mock'));
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): ICameraService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
