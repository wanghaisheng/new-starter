import { Camera, CameraResultType, CameraSource, Photo, ImageOptions } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraOptions extends Omit<ImageOptions, 'resultType'> {
  resultType?: CameraResultType;
}

export class CameraService {
  private static instance: CameraService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if camera is available
      if (!Capacitor.isNativePlatform()) {
        console.warn('Camera is only available on native platforms');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      throw error;
    }
  }

  async takePicture(options: CameraOptions = {}): Promise<Photo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        correctOrientation: true,
        ...options,
      };

      const image = await Camera.getPhoto(defaultOptions);
      return image;
    } catch (error) {
      console.error('Failed to take picture:', error);
      throw error;
    }
  }

  async pickImage(options: CameraOptions = {}): Promise<Photo> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const defaultOptions: ImageOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: 1024,
        height: 1024,
        correctOrientation: true,
        ...options,
      };

      const image = await Camera.getPhoto(defaultOptions);
      return image;
    } catch (error) {
      console.error('Failed to pick image:', error);
      throw error;
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { camera } = await Camera.checkPermissions();
      return camera === 'granted';
    } catch (error) {
      console.error('Failed to check camera permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { camera } = await Camera.requestPermissions();
      return camera === 'granted';
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
} 