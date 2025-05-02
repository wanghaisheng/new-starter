import { loadEnhancers, Enhancer } from "./enhancer";
import type { IOnboardConfigAdapter } from "../types/onboard-config-adapter.types";

interface MainAdapterOptions {
  env: Record<string, any>;
  user: Record<string, any>;
}

export class MainOnboardAdapter implements IOnboardConfigAdapter {
  private enhancers: Enhancer[];
  private env: Record<string, any>;
  private user: Record<string, any>;

  constructor(options: MainAdapterOptions) {
    this.env = options.env;
    this.user = options.user;
    this.enhancers = this.composeEnhancers();
  }

  // 动态组合 enhancer
  private composeEnhancers(): Enhancer[] {
    // 可根据用户特征进一步筛选/排序 enhancer
    return loadEnhancers(this.env);
  }

  // 示例：获取新手引导配置
  async getOnboardConfig(options: any): Promise<any> {
    let config = await this.loadConfig(options);
    for (const enhancer of this.enhancers) {
      config = enhancer.enhance(config, { env: this.env, user: this.user });
    }
    return config;
  }

  // 加载配置（可对接远程、本地等多种来源）
  private async loadConfig(options: any): Promise<any> {
    // TODO: 实现具体配置加载逻辑
    return {};
  }

  // 其他接口方法可按需实现
}