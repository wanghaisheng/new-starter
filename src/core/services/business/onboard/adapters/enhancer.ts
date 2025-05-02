// 高级能力增强器注册与动态加载
import { OnboardEnhancer } from "../types/onboard-config-adapter.types";

// 定义各类 enhancer 的接口
export interface Enhancer {
  name: string;
  enable(env: Record<string, any>): boolean;
  enhance(data: any, context: any): any;
}

// AB 测试 enhancer 示例
export class ABTestEnhancer implements Enhancer {
  name = "abtest";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_ABTEST_ENABLE;
  }
  enhance(data: any, context: any) {
    // AB 测试逻辑
    return data;
  }
}

// 灰度发布 enhancer 示例
export class GrayReleaseEnhancer implements Enhancer {
  name = "grayrelease";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_GRAY_ENABLE;
  }
  enhance(data: any, context: any) {
    // 灰度发布逻辑
    return data;
  }
}

// 多语言 enhancer 示例
export class I18nEnhancer implements Enhancer {
  name = "i18n";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_I18N_ENABLE;
  }
  enhance(data: any, context: any) {
    // 多语言处理逻辑
    return data;
  }
}

// enhancer 注册表
const enhancerList: Enhancer[] = [
  new ABTestEnhancer(),
  new GrayReleaseEnhancer(),
  new I18nEnhancer()
];

// 动态加载启用的 enhancer
export function loadEnhancers(env: Record<string, any>): Enhancer[] {
  return enhancerList.filter(e => e.enable(env));
}

// 主流程 adapter 可调用 loadEnhancers(env) 获取启用的 enhancer 组合