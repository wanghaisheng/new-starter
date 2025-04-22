// 用户服务注册表/单例工厂，支持多环境多实例注册与获取
import type { IUserService } from '@/core/services/business/user/types/user-service';
import { UserServiceFactory, UserServiceType, UserServiceOptions } from '@/core/services/business/user/factory/user-service-factory';

/**
 * 用户服务注册表，支持多实例、mock/remote/hybrid 切换，支持 provider 插件式注册
 * 推荐所有 hooks/页面通过本注册表统一获取实例，避免直接调用工厂
 */
export class UserServiceRegistry {
  private static instance: UserServiceRegistry;
  private registry: Record<string, IUserService> = {};
  private static adapters: Partial<Record<UserServiceType, (options?: UserServiceOptions) => IUserService>> = {};

  private constructor() {
    UserServiceRegistry.registerAllAdapters();
  }

  static getInstance() {
    if (!this.instance) this.instance = new UserServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   * @param type 服务类型（mock/remote/hybrid）
   * @param name 实例名，默认 'default'
   * @param options 其它扩展参数，预留
   */
  getProvider(type: UserServiceType = 'hybrid', name: string = 'default', options?: UserServiceOptions): () => IUserService {
    return () => this.createService(type, name, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(type: UserServiceType = 'hybrid', name: string = 'default', options?: UserServiceOptions): IUserService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = UserServiceRegistry.adapters[type];
    const service = adapter
      ? adapter(options)
      : UserServiceFactory.createService({ type, options });
    this.registry[key] = service;
    return service;
  }

  getService(type: UserServiceType, name: string = 'default'): IUserService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: UserServiceType, factory: (options?: UserServiceOptions) => IUserService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: UserServiceType): ((options?: UserServiceOptions) => IUserService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: UserServiceType): void {
    delete this.adapters[type];
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，最后 mock
   */
  getDefaultService(options?: UserServiceOptions): IUserService {
    // 保持参数签名统一，参数未用到
    return (
      this.getService('hybrid') ||
      this.getService('remote') ||
      this.getService('mock') ||
      this.createService('mock', 'default', options)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    UserServiceRegistry.registerAdapter('mock', (options) => UserServiceFactory.createService({ type: 'mock', options }));
    UserServiceRegistry.registerAdapter('remote', (options) => UserServiceFactory.createService({ type: 'remote', options }));
    UserServiceRegistry.registerAdapter('hybrid', (options) => UserServiceFactory.createService({ type: 'hybrid', options }));
  }
}
