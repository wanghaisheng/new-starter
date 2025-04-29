import type { ICameraService, CameraServiceType, CameraServiceOptions } from '../types/camera-service';
import { CameraServiceFactory } from '../factory/camera-service-factory';
import { getConfigService } from '@/core/services/infrastructure/config';

export interface CameraServiceConfig {
  environment?: string;
  name?: string;
  type?: CameraServiceType;
  options?: CameraServiceOptions;
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
    let service: ICameraService;
    try {
      const adapter = CameraServiceRegistry.adapters[type!];
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

  getService(environment: string, name: string): ICameraService | undefined {
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
    CameraServiceRegistry.registerAdapter('mock', () => CameraServiceFactory.createService({ type: 'mock' }));
    CameraServiceRegistry.registerAdapter('web', () => CameraServiceFactory.createService({ type: 'web' }));
    CameraServiceRegistry.registerAdapter('capacitor', () => CameraServiceFactory.createService({ type: 'capacitor' }));
  }

  getProvider(
    type: CameraServiceType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: CameraServiceOptions
  ): () => ICameraService {
    return () => this.createService({ environment: type, name, type, options });
  }

  getDefaultService(_dataService?: unknown): ICameraService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
