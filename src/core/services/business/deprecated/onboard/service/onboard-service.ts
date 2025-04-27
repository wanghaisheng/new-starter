import type { IOnboardService } from '../types/onboard-service';
import type { OnboardStep, OnboardConfig } from '@/core/lib/db/types/onboard.types';

/**
 * OnboardService - 支持本地/远程/多语言/分组/多端等多场景
 * 可扩展为远程拉取、CMS、A/B 测试等
 */
export class OnboardService implements IOnboardService {
  // 可替换为远程获取、CMS 拉取等
  private static defaultConfig: OnboardConfig = {
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

  async getConfig(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardConfig> {
    // TODO: 可根据 options.locale、abTestGroup、platform 返回不同配置
    return OnboardService.defaultConfig;
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
