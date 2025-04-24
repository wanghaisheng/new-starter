import type { OnboardStep, OnboardConfig } from '@/core/lib/db/types/onboard.types';

/**
 * Onboard 服务接口
 * 支持本地/远程配置、A/B 测试、多语言、动态内容等
 */
export interface IOnboardService {
  /** 获取当前引导配置（可自动按 locale/abTestGroup/platform 适配） */
  getConfig(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardConfig>;

  /** 获取全部步骤 */
  getSteps(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardStep[]>;
}
