// Huawei 专用 CameraService 实现模板
import { CameraService } from './camera-service';

export class HuaweiCameraService extends CameraService {
  async requestPermissions(): Promise<boolean> {
    // 可在此处添加华为机型专用权限处理或兼容逻辑
    // 例如：检测特定浏览器 UA 或系统特性，做定制化适配
    return super.requestPermissions();
  }

  // 可扩展更多华为专用方法，如特殊拍照流、接口兼容等
}
