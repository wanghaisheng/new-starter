// 测评服务注册表/单例工厂，支持多环境多实例注册与获取，并内置 provider 注册机制
import { IQuizService } from '../types/quiz-service';
import { QuizServiceFactory } from '../factory/quiz-service-factory';

/**
 * 测评服务注册表，支持多实例、mock/remote/hybrid 切换，支持 provider 插件式注册
 * 推荐所有 hooks/页面通过本注册表统一获取实例，避免直接调用工厂
 */
export class QuizServiceRegistry {
  private static instance: QuizServiceRegistry;
  private registry: Record<string, IQuizService> = {};
  private static providers: Map<string, (apiBaseUrl?: string) => IQuizService> = new Map();

  private constructor() {
    // 默认注册底层 provider，兼容底层自定义工厂
    QuizServiceRegistry.registerProvider('mock', (apiBaseUrl) => QuizServiceFactory.createService('mock', apiBaseUrl));
    QuizServiceRegistry.registerProvider('remote', (apiBaseUrl) => QuizServiceFactory.createService('remote', apiBaseUrl));
    QuizServiceRegistry.registerProvider('hybrid', (apiBaseUrl) => QuizServiceFactory.createService('hybrid', apiBaseUrl));
  }

  static getInstance() {
    if (!this.instance) this.instance = new QuizServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取测评服务实例
   * @param type mock/remote/hybrid/自定义
   * @param apiBaseUrl 远程 API 地址
   * @param name 实例名（默认 default）
   */
  createService(type: string = 'remote', apiBaseUrl?: string, name: string = 'default'): IQuizService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    // 优先用 provider，否则 fallback 到工厂
    const provider = QuizServiceRegistry.providers.get(type);
    const service = provider ? provider(apiBaseUrl) : QuizServiceFactory.createService(type as any, apiBaseUrl);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: string, name: string = 'default'): IQuizService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 兼容 hooks 场景的 provider 用法
   */
  getProvider(type: string = 'remote', apiBaseUrl?: string, name: string = 'default'): (() => IQuizService) {
    return () => this.createService(type, apiBaseUrl, name);
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerProvider(type: string, factory: (apiBaseUrl?: string) => IQuizService): void {
    this.providers.set(type, factory);
  }
  static getProviderFactory(type: string): ((apiBaseUrl?: string) => IQuizService) | undefined {
    return this.providers.get(type);
  }
  static unregisterProvider(type: string): void {
    this.providers.delete(type);
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(_dataService?: unknown): IQuizService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock')
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }
}
