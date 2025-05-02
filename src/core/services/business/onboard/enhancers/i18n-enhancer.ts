import { Enhancer } from "../adapters/enhancer";

export class I18nEnhancer implements Enhancer {
  name = "i18n";
  enable(env: Record<string, any>) {
    return !!env.ONBOARD_I18N_ENABLE;
  }
  enhance(data: any, context: any) {
    // TODO: 实现多语言处理逻辑，根据用户语言特征调整引导内容
    return data;
  }
}