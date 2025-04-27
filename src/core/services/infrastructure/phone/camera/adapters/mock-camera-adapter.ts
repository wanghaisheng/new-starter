import type { ICameraAdapter, CameraPhotoResult, CameraOptions, GalleryOptions } from '../types/camera-service';

export class MockCameraAdapter implements ICameraAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return true; }
  async takePhoto(options?: CameraOptions): Promise<CameraPhotoResult> {
    return { uri: 'mock-photo.jpg', width: 100, height: 100, mock: true };
  }
  async pickFromGallery(options?: GalleryOptions): Promise<CameraPhotoResult[]> {
    return [{ uri: 'mock-gallery.jpg', width: 100, height: 100, mock: true }];
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
