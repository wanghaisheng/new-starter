// 相机服务接口与适配器类型定义
export interface ICameraService {
  initialize(): Promise<void>;
  isAvailable(): boolean;
  takePhoto(options?: CameraOptions): Promise<CameraPhotoResult>;
  pickFromGallery(options?: GalleryOptions): Promise<CameraPhotoResult[]>;
  on(event: CameraEvent, handler: (payload: any) => void): void;
  off(event: CameraEvent, handler: (payload: any) => void): void;
}

export interface ICameraAdapter extends ICameraService {
  setConfig?(config: Record<string, any>): void;
  dispose?(): void;
}

export type CameraServiceType = 'web' | 'capacitor' | 'mock' | 'huawei' | 'xiaomi' | (string & {});
export type CameraEvent = 'photoTaken' | 'galleryPicked';
export interface CameraOptions { quality?: number; width?: number; height?: number; }
export interface GalleryOptions { maxCount?: number; }
export interface CameraPhotoResult { uri: string; base64?: string; width?: number; height?: number; [key: string]: any; }
