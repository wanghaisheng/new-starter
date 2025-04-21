import { ICameraAdapter, CameraServiceType } from '../types/camera-service';
import { MockCameraAdapter } from '../adapters/mock-camera-adapter';
import { WebCameraAdapter } from '../adapters/web-camera-adapter';
import { CapacitorCameraAdapter } from '../adapters/capacitor-camera-adapter';

export class CameraServiceFactory {
  private static adapters: Record<CameraServiceType, () => ICameraAdapter> = {};

  static registerAdapter(type: CameraServiceType, factory: () => ICameraAdapter) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: CameraServiceType): ICameraAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    CameraServiceFactory.registerAdapter('mock', () => new MockCameraAdapter());
    CameraServiceFactory.registerAdapter('web', () => new WebCameraAdapter());
    CameraServiceFactory.registerAdapter('capacitor', () => new CapacitorCameraAdapter());
    // 品牌/扩展适配器可在此扩展
  }
  static create(type: CameraServiceType = 'capacitor'): ICameraAdapter {
    CameraServiceFactory.registerAllAdapters();
    const adapter = this.getAdapter(type);
    if (adapter) return adapter;
    // fallback
    return this.getAdapter('mock')!;
  }
}
