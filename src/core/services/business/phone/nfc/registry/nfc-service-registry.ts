import type { INFCService, NFCServiceType } from '../types/nfc-service';
import { NFCServiceFactory } from '../factory/nfc-service-factory';

export interface NFCServiceConfig {
  environment: string;
  name: string;
  type: NFCServiceType;
  options?: Record<string, any>;
}

export class NFCServiceRegistry {
  private static instance: NFCServiceRegistry;
  private registry: Record<string, INFCService> = {};
  private static adapters: Record<string, () => INFCService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new NFCServiceRegistry();
    return this.instance;
  }

  createService(config: NFCServiceConfig): INFCService {
    const key = `${config.environment}:${config.name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = NFCServiceRegistry.adapters[config.type];
    const service = adapter ? adapter() : NFCServiceFactory.createService({ type: config.type, options: config.options });
    this.registry[key] = service;
    return service;
  }
  getService(environment: string, name: string): INFCService | undefined {
    return this.registry[`${environment}:${name}`];
  }
  clear() { this.registry = {}; }
  static registerAdapter(type: NFCServiceType, factory: () => INFCService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: NFCServiceType): INFCService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    NFCServiceRegistry.registerAdapter('web', () => NFCServiceFactory.createService({ type: 'web' }));
    NFCServiceRegistry.registerAdapter('capacitor', () => NFCServiceFactory.createService({ type: 'capacitor' }));
    NFCServiceRegistry.registerAdapter('mock', () => NFCServiceFactory.createService({ type: 'mock' }));
  }

  /**
   * 统一 getProvider 签名，供 hooks/业务层调用
   */
  getProvider(
    type: NFCServiceType = 'capacitor',
    name: string = 'default',
    _dataService?: unknown,
    options?: Record<string, any>
  ): () => INFCService {
    return () => this.createService({ environment: type, name, type, options });
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): INFCService {
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
