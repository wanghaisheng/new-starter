// 摄像头服务注册表
import { ICameraService } from './camera-service';

export class CameraRegistry {
  private static instance: CameraRegistry;
  private providers: Map<string, new () => ICameraService> = new Map();

  private constructor() {}

  static getInstance(): CameraRegistry {
    if (!CameraRegistry.instance) {
      CameraRegistry.instance = new CameraRegistry();
    }
    return CameraRegistry.instance;
  }

  registerProvider(type: string, provider: new () => ICameraService) {
    this.providers.set(type, provider);
  }

  unregisterProvider(type: string) {
    this.providers.delete(type);
  }

  create(type: string): ICameraService | undefined {
    const Provider = this.providers.get(type);
    return Provider ? new Provider() : undefined;
  }
}
