import { IBluetoothAdapter, BluetoothServiceType } from '../types/bluetooth-service';
import { MockBluetoothAdapter } from '../adapters/mock-bluetooth-adapter';
import { WebBluetoothAdapter } from '../adapters/web-bluetooth-adapter';
import { CapacitorBluetoothAdapter } from '../adapters/capacitor-bluetooth-adapter';

/**
 * 插件式蓝牙服务工厂，支持动态注册、自动降级、批量注册
 */
export class BluetoothServiceFactory {
  private static adapters: Record<BluetoothServiceType, () => IBluetoothAdapter> = {};

  /**
   * 注册自定义适配器
   */
  static registerAdapter(type: BluetoothServiceType, factory: () => IBluetoothAdapter) {
    this.adapters[type] = factory;
  }

  /**
   * 获取已注册适配器实例
   */
  static getAdapter(type: BluetoothServiceType): IBluetoothAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 一键注册所有内置适配器（推荐在应用入口调用一次）
   */
  static registerAllAdapters() {
    BluetoothServiceFactory.registerAdapter('mock', () => new MockBluetoothAdapter());
    BluetoothServiceFactory.registerAdapter('web', () => new WebBluetoothAdapter());
    BluetoothServiceFactory.registerAdapter('capacitor', () => new CapacitorBluetoothAdapter());
    // 品牌/扩展适配器可在此扩展
    // this.registerAdapter('huawei', () => new HuaweiBluetoothAdapter());
    // this.registerAdapter('xiaomi', () => new XiaomiBluetoothAdapter());
  }

  /**
   * 工厂方法，自动适配/降级，支持插件式扩展
   */
  static create(type: BluetoothServiceType = 'capacitor'): IBluetoothAdapter {
    BluetoothServiceFactory.registerAllAdapters();
    const adapter = this.getAdapter(type);
    if (adapter) return adapter;
    // fallback
    return this.getAdapter('mock')!;
  }
}

// 推荐在应用初始化时调用
// BluetoothServiceFactory.registerAllAdapters();
