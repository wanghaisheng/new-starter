import type { ICameraAdapter, ICameraService, CameraServiceType, CameraEvent, CameraOptions, GalleryOptions, CameraPhotoResult } from '../types/camera-service';
import { CameraServiceFactory } from '../factory/camera-service-factory';

// 统一相机服务实现，适配不同平台
export class CameraService implements ICameraService {
  private adapter: ICameraAdapter;

  constructor(type: CameraServiceType = 'capacitor', options: Record<string, any> = {}) {
    this.adapter = CameraServiceFactory.getAdapter(type, options) ?? CameraServiceFactory.getAdapter('mock')!;
  }

  async initialize() { return this.adapter.initialize(); }
  isAvailable(): boolean { return this.adapter.isAvailable(); }
  async takePhoto(options?: CameraOptions): Promise<CameraPhotoResult> { return this.adapter.takePhoto(options); }
  async pickFromGallery(options?: GalleryOptions): Promise<CameraPhotoResult[]> { return this.adapter.pickFromGallery(options); }
  on(event: CameraEvent, handler: (payload: any) => void): void { this.adapter.on(event, handler); }
  off(event: CameraEvent, handler: (payload: any) => void): void { this.adapter.off(event, handler); }
}
