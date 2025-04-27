import type { ILocationAdapter, ILocationService, LocationServiceType, LocationOptions, LocationResult, LocationServiceOptions } from '../types/location-service';
import { LocationServiceFactory } from '../factory/location-service-factory';

// 插件化适配器自动注入的统一定位服务实现，兼容多端/多品牌/多供应商
export class LocationService implements ILocationService {
  private adapter: ILocationAdapter;

  /**
   * 构造函数，自动根据 type/options 获取适配器
   * @param type
   * @param options
   */
  constructor(type: LocationServiceType = 'capacitor', options: LocationServiceOptions = {}) {
    this.adapter = LocationServiceFactory.getAdapter(type, options) ?? LocationServiceFactory.getAdapter('mock')!;
  }

  /**
   * 初始化定位服务
   */
  async initialize() {
    if (typeof this.adapter.initialize === 'function') {
      await this.adapter.initialize();
    }
  }

  /**
   * 判断定位服务是否可用
   * @returns 
   */
  isAvailable(): boolean {
    return typeof this.adapter.isAvailable === 'function' ? this.adapter.isAvailable() : false;
  }

  /**
   * 获取当前位置
   * @param options 
   * @returns 
   */
  getCurrentPosition(options?: LocationOptions): Promise<LocationResult> {
    return this.adapter.getCurrentPosition(options);
  }

  /**
   * 监听位置变化
   * @param options 
   * @param handler 
   * @returns 
   */
  watchPosition(options: LocationOptions, handler: (result: LocationResult) => void): string {
    return this.adapter.watchPosition(options, handler);
  }

  /**
   * 清除位置监听
   * @param watchId 
   */
  clearWatch(watchId: string): void {
    if (typeof this.adapter.clearWatch === 'function') {
      this.adapter.clearWatch(watchId);
    }
  }

  /**
   * 设置定位服务配置（可选）
   * @param config 
   */
  setConfig?(config: Record<string, any>): void {
    if (typeof this.adapter.setConfig === 'function') {
      this.adapter.setConfig(config);
    }
  }

  /**
   * 释放定位服务资源（可选）
   */
  dispose?(): void {
    if (typeof this.adapter.dispose === 'function') {
      this.adapter.dispose();
    }
  }
}
