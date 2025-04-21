// 认证服务注册表/单例工厂，支持多类型多实例注册与获取，并内置适配器注册机制
import type { IAuthService } from '../types/auth-service';
import { AuthServiceFactory } from '../factory/auth-service-factory';
import { FirebaseAuthService } from '../adapters/firebase/firebase-auth-service';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { BetterAuthService } from '../adapters/better/better-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';

export interface AuthServiceConfig {
  environment: string;
  name: string;
  type: 'mock'|'firebase'|'better'|'hybrid';
}

export class AuthServiceRegistry {
  private static instance: AuthServiceRegistry;
  private registry: Record<string, IAuthService> = {};
  private static adapters: Record<string, () => IAuthService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new AuthServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取认证服务实例，支持自动降级到 mock
   * @param config 配置项（环境、名称、类型）
   */
  createService(config: Partial<AuthServiceConfig>): IAuthService {
    // 自动判定环境并降级
    const env = config.environment || (typeof process !== 'undefined' && process.env.NODE_ENV) || 'production';
    let type = config.type;
    if (!type) {
      if (env === 'test' || env === 'development' || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true')) {
        type = 'mock';
      } else {
        type = 'firebase';
      }
    }
    const name = config.name || 'default';
    const key = `${env}:${name}`;
    if (this.registry[key]) return this.registry[key];
    let service: IAuthService;
    try {
      const adapter = AuthServiceRegistry.adapters[type];
      service = adapter ? adapter() : AuthServiceFactory.createService(type);
    } catch (e) {
      // firebase/better/hybrid 创建失败兜底为 mock
      if (type !== 'mock') {
        const fallbackAdapter = AuthServiceRegistry.adapters['mock'];
        service = fallbackAdapter ? fallbackAdapter() : AuthServiceFactory.createService('mock');
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
   * @param name 实例名（默认 default）
   * @returns () => IAuthService
   */
  static getProvider(env: string = 'remote', name: string = 'default'): (() => IAuthService) {
    return () => AuthServiceRegistry.getInstance().createService({ environment: env, name });
  }

  /**
   * provider 注册与获取（插件式扩展场景）
   */
  static registerProvider(env: string, factory: (name?: string) => IAuthService): void {
    this.adapters[env] = factory;
  }
  static getProviderFactory(env: string): ((name?: string) => IAuthService) | undefined {
    return this.adapters[env];
  }
  static unregisterProvider(env: string): void {
    delete this.adapters[env];
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: string, factory: () => IAuthService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: string): IAuthService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 批量注册所有内置认证适配器（可在应用入口调用一次）
   */
  static registerAllAdapters() {
    AuthServiceRegistry.registerAdapter('mock', () => new MockAuthService());
    AuthServiceRegistry.registerAdapter('firebase', () => new FirebaseAuthService());
    AuthServiceRegistry.registerAdapter('better', () => new BetterAuthService());
    AuthServiceRegistry.registerAdapter('hybrid', () => new HybridAuthService());
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(): IAuthService {
    return (
      this.createService({ environment: 'remote', name: 'default' }) ||
      this.createService({ environment: 'hybrid', name: 'default' }) ||
      this.createService({ environment: 'mock', name: 'default' })
    );
  }
}

// 用法：在应用初始化时调用 AuthServiceRegistry.registerAllAdapters()
// AuthServiceRegistry.registerAllAdapters();
