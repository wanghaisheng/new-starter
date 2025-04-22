import type { ICameraAdapter, ICameraService, CameraServiceType, CameraServiceOptions } from '../types/camera-service';
import { MockCameraAdapter } from '../adapters/mock-camera-adapter';
import { WebCameraAdapter } from '../adapters/web-camera-adapter';
import { CapacitorCameraAdapter } from '../adapters/capacitor-camera-adapter';
import { CameraService } from '../service/camera-service';

/**
 * 插件化注册表+工厂函数模式
 * 支持多品牌、多端能力、多供应商动态扩展
 * 强烈建议所有新适配器通过 registerAdapter 注册，严禁硬编码在 createService
 */
export class CameraServiceFactory {
  // 避免类型丢失，初始化时预置所有必需类型（如需扩展请在 registerAllAdapters 注册）
  private static adapters: Record<CameraServiceType, (options?: CameraServiceOptions) => ICameraAdapter> = {
    mock: () => new MockCameraAdapter(),
    web: () => new WebCameraAdapter(),
    capacitor: () => new CapacitorCameraAdapter(),
    // 其它类型如 huawei/xiaomi/brandX 可动态注册
  } as any;

  /**
   * 注册适配器工厂函数
   */
  static registerAdapter(type: CameraServiceType, factory: (options?: CameraServiceOptions) => ICameraAdapter) {
    this.adapters[type] = factory;
  }

  /**
   * 获取指定类型的适配器实例
   */
  static getAdapter(type: CameraServiceType, options?: CameraServiceOptions): ICameraAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  /**
   * 注册所有内置适配器（可按需扩展）
   */
  static registerAllAdapters() {
    this.registerAdapter('mock', () => new MockCameraAdapter());
    this.registerAdapter('web', () => new WebCameraAdapter());
    this.registerAdapter('capacitor', () => new CapacitorCameraAdapter());
    // 品牌/扩展适配器可在此扩展
  }

  /**
   * 统一创建 CameraService 实例，自动注入适配器
   */
  static createService({
    type = 'capacitor',
    options = {}
  }: {
    type?: CameraServiceType,
    options?: CameraServiceOptions
  } = {}): ICameraService {
    this.registerAllAdapters(); // 确保所有适配器已注册
    return new CameraService(type, options);
  }
}
