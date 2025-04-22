import type { IBluetoothService, BluetoothServiceType } from '../types/bluetooth-service';
import { BluetoothServiceFactory, BluetoothServiceOptions } from '../factory/bluetooth-service-factory';

export interface BluetoothServiceConfig {
  environment: string;
  name: string;
  type: BluetoothServiceType;
  options?: BluetoothServiceOptions;
}

/**
 * 蓝牙服务注册表/单例工厂，支持多环境多实例注册与插件式适配器扩展
 */
export class BluetoothServiceRegistry {
  private static instance: BluetoothServiceRegistry;
  private registry: Record<string, IBluetoothService> = {};
  private static adapters: Record<string, (options?: BluetoothServiceOptions) => IBluetoothService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new BluetoothServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取蓝牙服务实例
   * @param config 配置项（环境、名称、类型、options）
   */
  createService(config: BluetoothServiceConfig): IBluetoothService {
    const key = `${config.environment}:${config.name}`;
    if (this.registry[key]) return this.registry[key];
    // 优先用插件式适配器，否则走工厂
    const adapter = BluetoothServiceRegistry.adapters[config.type];
    const service = adapter ? adapter(config.options) : BluetoothServiceFactory.createService({ type: config.type, options: config.options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(environment: string, name: string): IBluetoothService | undefined {
    const key = `${environment}:${name}`;
    return this.registry[key];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 插件式适配器注册与获取
   */
  static registerAdapter(type: BluetoothServiceType, factory: (options?: BluetoothServiceOptions) => IBluetoothService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: BluetoothServiceType): IBluetoothService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 批量注册所有内置适配器（可在应用入口调用一次）
   */
  static registerAllAdapters() {
    BluetoothServiceRegistry.registerAdapter('web', (options) => BluetoothServiceFactory.createService({ type: 'web', options }));
    BluetoothServiceRegistry.registerAdapter('capacitor', (options) => BluetoothServiceFactory.createService({ type: 'capacitor', options }));
    BluetoothServiceRegistry.registerAdapter('mock', (options) => BluetoothServiceFactory.createService({ type: 'mock', options }));
    // 可扩展 huawei/xiaomi 等
    // BluetoothServiceRegistry.registerAdapter('huawei', (options) => BluetoothServiceFactory.createService({ type: 'huawei', options }));
    // BluetoothServiceRegistry.registerAdapter('xiaomi', (options) => BluetoothServiceFactory.createService({ type: 'xiaomi', options }));
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): IBluetoothService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote', 'default') ||
      this.getService('hybrid', 'default') ||
      this.getService('mock', 'default') ||
      this.createService({ environment: 'default', name: 'default', type: 'mock' })
    );
  }
}

// 用法：在应用初始化时调用 BluetoothServiceRegistry.registerAllAdapters();
// BluetoothServiceRegistry.registerAllAdapters();
