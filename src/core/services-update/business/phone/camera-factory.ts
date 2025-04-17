// 摄像头服务工厂
import { ICameraService, CameraService, MockCameraService } from './camera-service';

export type CameraServiceType = 'default' | 'mock';

export class CameraFactory {
  static create(type: CameraServiceType = 'default'): ICameraService {
    switch (type) {
      case 'mock':
        return new MockCameraService();
      case 'default':
      default:
        return new CameraService();
    }
  }
}
