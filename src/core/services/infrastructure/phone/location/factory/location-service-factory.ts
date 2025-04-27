import type { ILocationAdapter, LocationServiceType, ILocationService, LocationServiceOptions } from '../types/location-service';
import { MockLocationAdapter } from '../adapters/mock-location-adapter';
import { WebLocationAdapter } from '../adapters/web-location-adapter';
import { CapacitorLocationAdapter } from '../adapters/capacitor-location-adapter';
import { LocationService } from '../service/location-service';

export class LocationServiceFactory {
  // 插件化注册表，初始化时预置所有必需类型
  private static adapters: Record<LocationServiceType, (options?: LocationServiceOptions) => ILocationAdapter> = {
    mock: () => new MockLocationAdapter(),
    web: () => new WebLocationAdapter(),
    capacitor: () => new CapacitorLocationAdapter(),
    huawei: () => new MockLocationAdapter(), // 可扩展为 HuaweiAdapter
    xiaomi: () => new MockLocationAdapter(), // 可扩展为 XiaomiAdapter
  } as any;

  /**
   * 注册适配器工厂函数
   */
  static registerAdapter(type: LocationServiceType, factory: (options?: LocationServiceOptions) => ILocationAdapter) {
    this.adapters[type] = factory;
  }

  /**
   * 获取指定类型的适配器实例
   */
  static getAdapter(type: LocationServiceType, options?: LocationServiceOptions): ILocationAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  /**
   * 注册所有内置适配器（可按需扩展）
   */
  static registerAllAdapters() {
    this.registerAdapter('mock', () => new MockLocationAdapter());
    this.registerAdapter('web', () => new WebLocationAdapter());
    this.registerAdapter('capacitor', () => new CapacitorLocationAdapter());
    // 品牌/扩展适配器可在此扩展
  }

  /**
   * 统一创建 LocationService 实例，自动注入适配器
   */
  static createService({
    type = 'capacitor',
    options = {}
  }: {
    type?: LocationServiceType,
    options?: LocationServiceOptions
  } = {}): ILocationService {
    this.registerAllAdapters(); // 确保所有适配器已注册
    return new LocationService(type, options);
  }
}
