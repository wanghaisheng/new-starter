import { OnboardConfig } from "./onboard.types";

/**
 * IOnboardConfigAdapter - 新手引导配置适配器接口
 * 用于从数据库、远程服务等动态获取 OnboardConfig 配置
 */
export interface IOnboardConfigAdapter {
  /**
   * 获取新手引导配置（支持异步、可扩展参数）
   * @param options 可选参数（如用户ID、平台、语言等）
   */
  getOnboardConfig(options?: Record<string, any>): Promise<OnboardConfig | null>;
}