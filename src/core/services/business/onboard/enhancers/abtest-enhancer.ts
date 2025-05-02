import { Enhancer } from "../adapters/enhancer";

export class ABTestEnhancer implements Enhancer {
  name = "abtest";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_ABTEST_ENABLE;
  }
  enhance(data: any, context: any) {
    // TODO: 实现 AB 测试分流逻辑，根据用户特征分配不同引导配置
    return data;
  }
}