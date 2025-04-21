import type { INFCService, NFCServiceType } from '../types/nfc-service';
import { NFCServiceFactory } from '../factory/nfc-service-factory';

export interface NFCServiceConfig {
  environment: string;
  name: string;
  type: NFCServiceType;
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
    const service = adapter ? adapter() : NFCServiceFactory.create(config.type);
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
    NFCServiceRegistry.registerAdapter('web', () => NFCServiceFactory.create('web'));
    NFCServiceRegistry.registerAdapter('capacitor', () => NFCServiceFactory.create('capacitor'));
    NFCServiceRegistry.registerAdapter('mock', () => NFCServiceFactory.create('mock'));
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): INFCService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}
