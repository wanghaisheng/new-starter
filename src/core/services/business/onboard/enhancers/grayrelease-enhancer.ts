import { Enhancer } from "../adapters/enhancer";

export class GrayReleaseEnhancer implements Enhancer {
  name = "grayrelease";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_GRAY_ENABLE;
  }
  enhance(data: any, context: any) {
    // TODO: 实现灰度发布逻辑，根据用户特征决定是否下发新引导配置
    return data;
  }
}