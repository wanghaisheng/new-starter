import type { ICameraAdapter, CameraPhotoResult, CameraOptions, GalleryOptions } from '../types/camera-service';

export class WebCameraAdapter implements ICameraAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  async takePhoto(options?: CameraOptions): Promise<CameraPhotoResult> {
    // 实际实现应调用 getUserMedia 拍照，这里仅返回 mock 数据
    return { uri: 'web-photo.jpg', width: 320, height: 240, web: true };
  }
  async pickFromGallery(options?: GalleryOptions): Promise<CameraPhotoResult[]> {
    // 实际实现应弹出文件选择，这里仅返回 mock 数据
    return [{ uri: 'web-gallery.jpg', width: 320, height: 240, web: true }];
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
