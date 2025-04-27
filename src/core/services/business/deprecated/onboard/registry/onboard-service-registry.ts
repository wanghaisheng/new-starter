import { OnboardService } from '../service/onboard-service';
import type { IOnboardService } from '../types/onboard-service';

/**
 * OnboardServiceRegistry - 负责 OnboardService 的实例获取与多环境适配
 * 可扩展支持 mock/remote/CMS 等
 */
export class OnboardServiceRegistry {
  static getDefaultService(): IOnboardService {
    // 可根据环境变量切换不同实现
    return new OnboardService();
  }
}
