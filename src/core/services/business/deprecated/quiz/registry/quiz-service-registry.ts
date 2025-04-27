// 测评服务注册表/单例工厂，支持多环境多实例注册与获取，并内置 provider 注册机制
import { IQuizService } from '../types/quiz-service';
import { QuizServiceFactory, QuizServiceType, QuizServiceOptions } from '../factory/quiz-service-factory';

/**
 * 测评服务注册表，支持多实例、mock/remote/hybrid 切换，支持 provider 插件式注册
 * 推荐所有 hooks/页面通过本注册表统一获取实例，避免直接调用工厂
 */
export class QuizServiceRegistry {
  private static instance: QuizServiceRegistry;
  private registry: Record<string, IQuizService> = {};
  private static adapters: Partial<Record<QuizServiceType, (options?: QuizServiceOptions) => IQuizService>> = {};

  private constructor() {
    // 默认注册底层 provider，兼容底层自定义工厂
    QuizServiceRegistry.registerAllAdapters();
  }

  static getInstance() {
    if (!this.instance) this.instance = new QuizServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型（mock/remote/hybrid/自定义）
   * @param name 实例名，默认 'default'
   * @param options 其它扩展参数，预留
   */
  getProvider(type: QuizServiceType = 'remote', name: string = 'default', options?: QuizServiceOptions): () => IQuizService {
    return () => this.createService(type, name, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(type: QuizServiceType = 'remote', name: string = 'default', options?: QuizServiceOptions): IQuizService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = QuizServiceRegistry.adapters[type];
    const service = adapter
      ? adapter(options)
      : QuizServiceFactory.createService({ type, options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: QuizServiceType, name: string = 'default'): IQuizService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: QuizServiceType, factory: (options?: QuizServiceOptions) => IQuizService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: QuizServiceType): ((options?: QuizServiceOptions) => IQuizService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: QuizServiceType): void {
    delete this.adapters[type];
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(options?: QuizServiceOptions): IQuizService {
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock', 'default', options)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    QuizServiceRegistry.registerAdapter('mock', (options) => QuizServiceFactory.createService({ type: 'mock', options }));
    QuizServiceRegistry.registerAdapter('remote', (options) => QuizServiceFactory.createService({ type: 'remote', options }));
    QuizServiceRegistry.registerAdapter('hybrid', (options) => QuizServiceFactory.createService({ type: 'hybrid', options }));
  }
}
