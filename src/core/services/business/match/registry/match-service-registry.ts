// 匹配服务注册表/单例工厂，支持多类型多实例注册与获取，兼容底层 provider 注册
import type { IMatchService } from '../types/match-service';
import type { IDataService } from '@/core/services/data/types';
import { MatchServiceFactory } from '../factory/match-service-factory';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';
import { RemoteMatchServiceAdapter } from '../adapters/remote-match-service-adapter';
import { HybridMatchServiceAdapter } from '../adapters/hybrid-match-service-adapter';
import { BrandAMatchServiceAdapter } from '../adapters/brandA-match-service-adapter';
import { BrandBMatchServiceAdapter } from '../adapters/brandB-match-service-adapter';

export class MatchServiceRegistry {
  private static instance: MatchServiceRegistry;
  private registry: Record<string, IMatchService> = {};
  private providers: Map<string, (dataService: IDataService) => IMatchService> = new Map();

  private constructor() {
    // 默认注册底层 provider，兼容底层自定义工厂
    this.registerProvider('mock', (ds) => new MockMatchServiceAdapter(ds!));
    this.registerProvider('remote', (ds) => new RemoteMatchServiceAdapter(ds!));
    this.registerProvider('hybrid', (ds) => new HybridMatchServiceAdapter(ds!));
    this.registerProvider('brandA', (ds) => new BrandAMatchServiceAdapter(ds!));
    this.registerProvider('brandB', (ds) => new BrandBMatchServiceAdapter(ds!));
  }

  static getInstance() {
    if (!this.instance) this.instance = new MatchServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取匹配服务实例
   * @param type mock/remote/hybrid/brandA/brandB
   * @param name 实例名（默认 default）
   * @param dataService 必填，注入自定义数据服务实例
   */
  createService(type: 'mock'|'remote'|'hybrid'|'brandA'|'brandB' = 'remote', name: string = 'default', dataService: IDataService): IMatchService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    // 统一通过工厂创建，支持自动降级和自定义 dataService
    const service = MatchServiceFactory.createService(dataService, type);
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: string, name: string = 'default'): IMatchService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 兼容 hooks 场景的 provider 用法
   */
  getProvider(type: 'mock'|'remote'|'hybrid'|'brandA'|'brandB' = 'remote', name: string = 'default', dataService: IDataService): (() => IMatchService) {
    return () => this.createService(type, name, dataService);
  }

  /**
   * 底层 provider 注册与获取（如需自定义底层适配器工厂，可用此机制）
   */
  public registerProvider(type: string, factory: (dataService: IDataService) => IMatchService): void {
    this.providers.set(type, factory);
  }
  public getProviderFactory(type: string): ((dataService: IDataService) => IMatchService) | undefined {
    return this.providers.get(type);
  }
  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(dataService?: IDataService): IMatchService {
    // 只有 match 需要 dataService
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      (dataService ? this.createService('mock', 'default', dataService) : undefined)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }
}
