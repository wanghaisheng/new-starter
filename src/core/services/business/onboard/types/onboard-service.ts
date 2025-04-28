import type { OnboardStep, OnboardConfig } from '@/core/lib/db/types/onboard.types';

/**
 * IOnboardService 定义 onboarding 业务服务的接口，便于实现分层、解耦和扩展。
 * - getConfig: 获取 onboarding 配置，可根据 locale、abTestGroup、platform 等参数返回不同配置。
 * - getSteps: 获取 onboarding 步骤数组，支持多参数场景。
 *
 * 扩展点：
 * 1. 可对接远程配置、A/B 测试、CMS 等。
 * 2. 支持多语言、多平台适配。
 * 3. 可根据业务需求扩展参数类型。
 */
export interface IOnboardService {
  /**
   * 获取 onboarding 配置
   * @param options 可选参数，如 locale、abTestGroup、platform 等
   * @returns OnboardConfig 配置对象
   */
  getConfig(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardConfig>;

  /**
   * 获取 onboarding 步骤数组
   * @param options 可选参数，如 locale、abTestGroup、platform 等
   * @returns OnboardStep 数组
   */
  getSteps(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: any;
  }): Promise<OnboardStep[]>;
}