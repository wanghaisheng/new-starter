// 匹配服务注册表/单例工厂，支持多类型多实例注册与获取，兼容底层 provider 注册
import type { IMatchService } from '../types/match-service';
import type { IDataService } from '@/core/services/data/types';
import { MatchServiceFactory, MatchServiceType, MatchServiceOptions } from '../factory/match-service-factory';

export class MatchServiceRegistry {
  private static instance: MatchServiceRegistry;
  private registry: Record<string, IMatchService> = {};
  private static adapters: Partial<Record<MatchServiceType, (dataService: IDataService, options?: MatchServiceOptions) => IMatchService>> = {};

  private constructor() {
    MatchServiceRegistry.registerAllAdapters();
  }

  static getInstance() {
    if (!this.instance) this.instance = new MatchServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型（mock/remote/hybrid/brandA/brandB）
   * @param name 实例名，默认 'default'
   * @param dataService 必填，部分服务如 Match 需注入
   * @param options 其它扩展参数，预留
   */
  getProvider(type: MatchServiceType = 'remote', name: string = 'default', dataService: IDataService, options?: MatchServiceOptions): () => IMatchService {
    return () => this.createService(type, name, dataService, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   * 支持 options 多维 context 分流、优先级、自动降级
   */
  createService(type: MatchServiceType = 'remote', name: string = 'default', dataService: IDataService, options?: MatchServiceOptions): IMatchService {
    if (!dataService) {
      throw new Error('[MatchServiceRegistry] dataService is required for match services');
    }
    // 动态分流：如 options.brand/options.provider/options.region 优先选择对应适配器
    let effectiveType = type;
    if (options?.brand && MatchServiceRegistry.adapters[options.brand as MatchServiceType]) {
      effectiveType = options.brand as MatchServiceType;
    } else if (options?.provider && MatchServiceRegistry.adapters[options.provider as MatchServiceType]) {
      effectiveType = options.provider as MatchServiceType;
    }
    const key = `${effectiveType}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = MatchServiceRegistry.adapters[effectiveType];
    const service = adapter
      ? adapter(dataService, options)
      : MatchServiceFactory.createService({ type: effectiveType, dataService, options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: MatchServiceType, name: string = 'default'): IMatchService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 底层 provider 注册与获取（如需自定义底层适配器工厂，可用此机制）
   */
  static registerAdapter(type: MatchServiceType, factory: (dataService: IDataService, options?: MatchServiceOptions) => IMatchService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: MatchServiceType): ((dataService: IDataService, options?: MatchServiceOptions) => IMatchService) | undefined {
    return this.adapters[type];
  }

  /**
   * dataService 必填，若全局无实例且未传 dataService，则抛出异常
   * 支持自动降级优先级：remote > hybrid > mock
   * 支持 options 多维 context 分流
   */
  getDefaultService(dataService: IDataService, options?: MatchServiceOptions): IMatchService {
    // 优先根据 options 分流
    if (options?.brand && this.getService(options.brand as MatchServiceType)) {
      return this.getService(options.brand as MatchServiceType)!;
    }
    if (options?.provider && this.getService(options.provider as MatchServiceType)) {
      return this.getService(options.provider as MatchServiceType)!;
    }
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock', 'default', dataService, options)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    MatchServiceRegistry.registerAdapter('mock', (dataService, options) => MatchServiceFactory.createService({ type: 'mock', dataService, options }));
    MatchServiceRegistry.registerAdapter('remote', (dataService, options) => MatchServiceFactory.createService({ type: 'remote', dataService, options }));
    MatchServiceRegistry.registerAdapter('hybrid', (dataService, options) => MatchServiceFactory.createService({ type: 'hybrid', dataService, options }));
    MatchServiceRegistry.registerAdapter('brandA', (dataService, options) => MatchServiceFactory.createService({ type: 'brandA', dataService, options }));
    MatchServiceRegistry.registerAdapter('brandB', (dataService, options) => MatchServiceFactory.createService({ type: 'brandB', dataService, options }));
  }
}
