import type { IOnboardService } from '../types/onboard-service';
import type { OnboardStep, OnboardConfig } from '@/core/lib/db/types/onboard.types';
import type { IOnboardConfigAdapter } from '../types/onboard-config-adapter.types';

/**
 * OnboardService 实现所有 onboarding 相关业务逻辑，符合 service-design-guidelines 分层要求。
 * 可扩展远程拉取、CMS、A/B 测试等。
 */
export class OnboardService implements IOnboardService {
  private adapter: IOnboardConfigAdapter;
  private enhancers: unknown[];
  private config: { onboardType: string; features: string[] };
  private configService: { get: (key: string) => any };
  private currentStepIndex = 0;

  /**
   * @param configService 配置服务（决定 onboard 策略、增强特性等）
   * @param adapterMap onboard 策略与 adapter 实例映射
   * @param enhancerMap 增强器工厂表
   */
  constructor(
    configService: any,
    adapterMap: Record<string, IOnboardConfigAdapter>,
    enhancerMap: Record<string, () => any>,
  ) {
    this.configService = configService;
    const onboardType = configService.get('ONBOARD_TYPE') || 'default';
    const enhancerList: string[] = configService.get('ONBOARD_FEATURES')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    this.config = { onboardType, features: enhancerList };
    this.adapter = adapterMap[onboardType] || adapterMap['default'];
    this.enhancers = enhancerList.map(key => enhancerMap[key]?.()).filter(Boolean);
  }
// 从配置服务的环境变量中获取options 也就是系统默认支持的onboard策略的配置
  private getOptions(): unknown {
    const options = this.configService.get('ONBOARD_OPTIONS');
    return options;
  }
  // onboard 策略的管理 增加删除  

// 根据options获取特定onboard信息
  async getConfig(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: unknown;
  }): Promise<OnboardConfig> {
    try {
      if (options && typeof options !== 'object') {
        throw new Error('参数 options 必须为对象');
      }
      const config = await this.adapter.getOnboardConfig(options);
      if (config) return config;
    } catch (err) {
      // 可以根据需要引入日志服务或上报
    }
    return {
      id: 'onboard-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'onboard-step-1-' + Date.now(),
          title: '遇见更好的自己',
          desc: '基于八字、性格、兴趣的智能推荐，开启你的专属缘分之旅',
          image: '/assets/onboard-1.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'onboard-step-2-' + Date.now(),
          title: '安全真实的社区',
          desc: '实名认证+专业审核，保护你的每一次心动',
          image: '/assets/onboard-2.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'onboard-step-3-' + Date.now(),
          title: '高效精准的匹配',
          desc: '多维画像，科学算法，帮你找到最合适的TA',
          image: '/assets/onboard-3.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      locale: options?.locale || 'zh',
      platform: options?.platform || 'app',
      configVersion: '1.0.0',
    };
  }

  async getSteps(options?: {
    locale?: string;
    abTestGroup?: string;
    platform?: string;
    [key: string]: unknown;
  }): Promise<OnboardStep[]> {
    try {
      const config = await this.getConfig(options);
      if (!config.steps || !Array.isArray(config.steps)) {
        throw new Error('Onboard 配置缺少 steps 字段或格式错误');
      }
      return config.steps;
    } catch (err) {
      return [];
    }
  }

  async goToStep(currentStep: number, targetStep: number, options?: { [key: string]: unknown; locale?: string; abTestGroup?: string; platform?: string }): Promise<OnboardStep | { code: string; message: string; detail?: unknown }> {
    try {
      if (typeof currentStep !== 'number' || typeof targetStep !== 'number') {
        return { code: 'INVALID_PARAM', message: 'currentStep 和 targetStep 必须为数字' };
      }
      const steps = await this.getSteps(options);
      if (!steps.length) {
        return { code: 'NO_STEPS', message: '未获取到 Onboard 步骤' };
      }
      if (targetStep < 0 || targetStep >= steps.length) {
        return { code: 'OUT_OF_RANGE', message: '目标步骤索引超出范围' };
      }
      this.currentStepIndex = targetStep;
      return steps[targetStep];
    } catch (err: unknown) {
      return { code: 'GO_TO_STEP_ERROR', message: (err as Error)?.message || '跳转步骤失败', detail: err };
    }
  }

  async nextStep(currentStep: number, options?: { [key: string]: unknown; locale?: string; abTestGroup?: string; platform?: string }): Promise<OnboardStep | { code: string; message: string; detail?: unknown }> {
    try {
      if (typeof currentStep !== 'number') {
        return { code: 'INVALID_PARAM', message: 'currentStep 必须为数字' };
      }
      const steps = await this.getSteps(options);
      if (!steps.length) {
        return { code: 'NO_STEPS', message: '未获取到 Onboard 步骤' };
      }
      const nextIndex = currentStep + 1;
      if (nextIndex >= steps.length) {
        return { code: 'OUT_OF_RANGE', message: '已到最后一步，无法前进' };
      }
      this.currentStepIndex = nextIndex;
      return steps[nextIndex];
    } catch (err: unknown) {
      return { code: 'NEXT_STEP_ERROR', message: (err as Error)?.message || '获取下一步失败', detail: err };
    }
  }

  async prevStep(currentStep: number, options?: { [key: string]: unknown; locale?: string; abTestGroup?: string; platform?: string }): Promise<OnboardStep | { code: string; message: string; detail?: unknown }> {
    try {
      if (typeof currentStep !== 'number') {
        return { code: 'INVALID_PARAM', message: 'currentStep 必须为数字' };
      }
      const steps = await this.getSteps(options);
      if (!steps.length) {
        return { code: 'NO_STEPS', message: '未获取到 Onboard 步骤' };
      }
      const prevIndex = currentStep - 1;
      if (prevIndex < 0) {
        return { code: 'OUT_OF_RANGE', message: '已到第一步，无法回退' };
      }
      this.currentStepIndex = prevIndex;
      return steps[prevIndex];
    } catch (err: unknown) {
      return { code: 'PREV_STEP_ERROR', message: (err as Error)?.message || '获取上一步失败', detail: err };
    }
  }

  async reportStatus(status: unknown, options?: unknown): Promise<{ success: boolean; message?: string } | { code: string; message: string; detail?: unknown }> {
    try {
      if (!status) {
        return { code: 'INVALID_PARAM', message: 'status 不能为空' };
      }
      return { success: true, message: '状态上报成功' };
    } catch (err: unknown) {
      return { code: 'REPORT_STATUS_ERROR', message: (err as Error)?.message || '状态上报失败', detail: err };
    }
  }

  async updateConfig(newConfig: OnboardConfig, options?: { locale?: string; abTestGroup?: string; platform?: string; [key: string]: unknown }): Promise<{ success: boolean; message?: string; detail?: unknown }> {
    try {
      if (!newConfig || typeof newConfig !== 'object') {
        return { success: false, message: '参数 newConfig 必须为对象' };
      }
      if (typeof (this.adapter as any).updateOnboardConfig !== 'function') {
        return { success: false, message: '当前适配器不支持配置更新' };
      }
      await (this.adapter as any).updateOnboardConfig(newConfig, options);
      return { success: true, message: '配置更新成功' };
    } catch (err: unknown) {
      return { success: false, message: (err as Error)?.message || '配置更新失败', detail: err };
    }
  }
}