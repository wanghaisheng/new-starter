import type { IBluetoothService, BluetoothServiceType } from '../types/bluetooth-service';
import { BluetoothServiceFactory } from '../factory/bluetooth-service-factory';

export interface BluetoothServiceConfig {
  environment: string;
  name: string;
  type: BluetoothServiceType;
}

/**
 * 蓝牙服务注册表/单例工厂，支持多环境多实例注册与插件式适配器扩展
 */
export class BluetoothServiceRegistry {
  private static instance: BluetoothServiceRegistry;
  private registry: Record<string, IBluetoothService> = {};
  private static adapters: Record<string, () => IBluetoothService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new BluetoothServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取蓝牙服务实例
   * @param config 配置项（环境、名称、类型）
   */
  createService(config: BluetoothServiceConfig): IBluetoothService {
    const key = `${config.environment}:${config.name}`;
    if (this.registry[key]) return this.registry[key];
    // 优先用插件式适配器，否则走工厂
    const adapter = BluetoothServiceRegistry.adapters[config.type];
    const service = adapter ? adapter() : BluetoothServiceFactory.create(config.type);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(environment: string, name: string): IBluetoothService | undefined {
    return this.registry[`${environment}:${name}`];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 插件式适配器注册与获取
   */
  static registerAdapter(type: BluetoothServiceType, factory: () => IBluetoothService) {
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
    BluetoothServiceRegistry.registerAdapter('web', () => BluetoothServiceFactory.create('web'));
    BluetoothServiceRegistry.registerAdapter('capacitor', () => BluetoothServiceFactory.create('capacitor'));
    BluetoothServiceRegistry.registerAdapter('mock', () => BluetoothServiceFactory.create('mock'));
    // 可扩展 huawei/xiaomi 等
    // BluetoothServiceRegistry.registerAdapter('huawei', () => BluetoothServiceFactory.create('huawei'));
    // BluetoothServiceRegistry.registerAdapter('xiaomi', () => BluetoothServiceFactory.create('xiaomi'));
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): IBluetoothService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService({ environment: 'mock', name: 'mock', type: 'mock' })
    );
  }
}

// 用法：在应用初始化时调用 BluetoothServiceRegistry.registerAllAdapters();
// BluetoothServiceRegistry.registerAllAdapters();
