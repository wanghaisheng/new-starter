import type { IOnboardService } from '../types/onboard-service';
import type { OnboardStep, OnboardConfig } from '@/core/lib/db/types/onboard.types';
import type { IOnboardConfigAdapter } from '../types/onboard-config-adapter.types';

/**
 * OnboardService 实现所有 onboarding 相关业务逻辑，符合 service-design-guidelines 分层要求。
 * 可扩展远程拉取、CMS、A/B 测试等。
 */
export class OnboardService implements IOnboardService {
  private configAdapter: IOnboardConfigAdapter;

  constructor(configAdapter: IOnboardConfigAdapter) {
    this.configAdapter = configAdapter;
  }

  async getConfig(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardConfig> {
    // 动态拉取配置，若失败可回退默认配置
    const config = await this.configAdapter.getOnboardConfig(options);
    if (config) return config;
    return {
      steps: [
        {
          title: '遇见更好的自己',
          desc: '基于八字、性格、兴趣的智能推荐，开启你的专属缘分之旅',
          image: '/assets/onboard-1.png',
        },
        {
          title: '安全真实的社区',
          desc: '实名认证+专业审核，保护你的每一次心动',
          image: '/assets/onboard-2.png',
        },
        {
          title: '高效精准的匹配',
          desc: '多维画像，科学算法，帮你找到最合适的TA',
          image: '/assets/onboard-3.png',
        },
      ],
      locale: 'zh',
      platform: 'app',
      configVersion: '1.0.0',
    };
  }

  async getSteps(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardStep[]> {
    return (await this.getConfig(options)).steps;
  }
}