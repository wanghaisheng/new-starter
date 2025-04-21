import type { ICameraAdapter, CameraPhotoResult, CameraOptions, GalleryOptions } from '../types/camera-service';

export class CapacitorCameraAdapter implements ICameraAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return typeof window !== 'undefined' && !!window.Capacitor; }
  async takePhoto(options?: CameraOptions): Promise<CameraPhotoResult> {
    // 实际实现应调用 Capacitor Camera 插件，这里仅返回 mock 数据
    return { uri: 'capacitor-photo.jpg', width: 640, height: 480, capacitor: true };
  }
  async pickFromGallery(options?: GalleryOptions): Promise<CameraPhotoResult[]> {
    // 实际实现应调用 Capacitor 插件，这里仅返回 mock 数据
    return [{ uri: 'capacitor-gallery.jpg', width: 640, height: 480, capacitor: true }];
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
