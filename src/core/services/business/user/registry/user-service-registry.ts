// 用户服务注册表/单例工厂，支持多环境多实例注册与获取
import type { IUserService } from '@/core/services/business/user/types/user-service';
import { UserServiceFactory } from '@/core/services/business/user/factory/user-service-factory';

/**
 * 用户服务注册表，支持多实例、mock/remote/hybrid 切换，支持 provider 插件式注册
 * 推荐所有 hooks/页面通过本注册表统一获取实例，避免直接调用工厂
 */
export class UserServiceRegistry {
  private static instance: UserServiceRegistry;
  private registry: Record<string, IUserService> = {};
  private static providers: Map<string, (apiBaseUrl?: string) => IUserService> = new Map();

  private constructor() {
    // 默认注册底层 provider，兼容底层自定义工厂
    UserServiceRegistry.registerProvider('mock', (apiBaseUrl) => UserServiceFactory.createService('mock', apiBaseUrl));
    UserServiceRegistry.registerProvider('remote', (apiBaseUrl) => UserServiceFactory.createService('remote', apiBaseUrl));
    UserServiceRegistry.registerProvider('hybrid', (apiBaseUrl) => UserServiceFactory.createService('hybrid', apiBaseUrl));
  }

  static getInstance() {
    if (!this.instance) this.instance = new UserServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取用户服务实例，支持自动降级到 mock
   * @param env mock/remote/hybrid
   * @param apiBaseUrl 远程 API 地址
   * @param name 实例名（默认 default）
   */
  createService(env?: 'mock'|'remote'|'hybrid', apiBaseUrl?: string, name: string = 'default'): IUserService {
    // 自动判定环境并降级
    let finalEnv = env;
    if (!finalEnv) {
      if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK === 'true')) {
        finalEnv = 'mock';
      } else {
        finalEnv = 'remote';
      }
    }
    const key = `${finalEnv}:${name}`;
    if (this.registry[key]) return this.registry[key];
    let service: IUserService;
    try {
      // 优先用 provider，否则 fallback 到工厂
      const provider = UserServiceRegistry.providers.get(finalEnv);
      service = provider ? provider(apiBaseUrl) : UserServiceFactory.createService(finalEnv, apiBaseUrl);
    } catch (e) {
      // remote/hybrid 创建失败兜底为 mock
      if (finalEnv !== 'mock') {
        service = UserServiceFactory.createService('mock');
      } else {
        throw e;
      }
    }
    this.registry[key] = service;
    return service;
  }

  /**
   * provider 插件式注册与获取（推荐 hooks 场景使用）
   * @param env mock/remote/hybrid
   * @param apiBaseUrl 远程 API 地址
   * @param name 实例名（默认 default）
   * @returns () => IUserService
   */
  static getProvider(env: 'mock'|'remote'|'hybrid' = 'remote', apiBaseUrl?: string, name: string = 'default'): (() => IUserService) {
    return () => UserServiceRegistry.getInstance().createService(env, apiBaseUrl, name);
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerProvider(env: string, factory: (apiBaseUrl?: string) => IUserService): void {
    this.providers.set(env, factory);
  }
  static getProviderFactory(env: string): ((apiBaseUrl?: string) => IUserService) | undefined {
    return this.providers.get(env);
  }
  static unregisterProvider(env: string): void {
    this.providers.delete(env);
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，最后 mock
   */
  getDefaultService(_dataService?: unknown): IUserService {
    // 保持参数签名统一，参数未用到
    return (
      this.createService('remote') ||
      this.createService('hybrid') ||
      this.createService('mock')
    );
  }
}
