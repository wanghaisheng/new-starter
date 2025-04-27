// 认证服务注册表/单例工厂，支持多类型多实例注册与获取，并内置适配器注册机制
import type { IAuthService } from '../types/auth-service';
import { AuthServiceFactory, AuthServiceType, AuthServiceOptions } from '../factory/auth-service-factory';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';

export interface AuthServiceConfig {
  environment: string;
  name: string;
  type: 'mock'|'firebase'|'better'|'hybrid';
}

export class AuthServiceRegistry {
  private static instance: AuthServiceRegistry;
  private registry: Record<string, IAuthService> = {};
  private static adapters: Partial<Record<AuthServiceType, () => IAuthService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new AuthServiceRegistry();
    return this.instance;
  }

  getProvider(type: AuthServiceType = 'mock', name: string = 'default', dataService?: any, options?: AuthServiceOptions): () => IAuthService {
    return () => this.createService(type, name, dataService, options);
  }

  createService(type: AuthServiceType = 'mock', name: string = 'default', dataService?: any, options?: AuthServiceOptions): IAuthService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = AuthServiceRegistry.adapters[type];
    const service = adapter
      ? adapter()
      : AuthServiceFactory.createService({ type, dataService, options });
    this.registry[key] = service;
    return service;
  }

  getService(type: AuthServiceType, name: string = 'default'): IAuthService | undefined {
    return this.registry[`${type}:${name}`];
  }

  static registerAdapter(type: AuthServiceType, factory: () => IAuthService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: AuthServiceType): (() => IAuthService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: AuthServiceType): void {
    delete this.adapters[type];
  }

  getDefaultService(dataService?: any, options?: AuthServiceOptions): IAuthService {
    return (
      this.getService('firebase') ||
      this.getService('hybrid') ||
      this.getService('better') ||
      this.getService('mock') ||
      this.createService('mock', 'default', dataService, options)
    );
  }

  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    AuthServiceRegistry.registerAdapter('mock', () => new MockAuthService());
    // 动态 require better-auth-service，仅在需要时加载
    AuthServiceRegistry.registerAdapter('better', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { BetterAuthService } = require('../adapters/better/better-auth-service');
      return new BetterAuthService();
    });
    AuthServiceRegistry.registerAdapter('hybrid', () => new HybridAuthService());
    AuthServiceRegistry.registerAdapter('firebase', () => AuthServiceFactory.createService({ type: 'firebase' }));
  }
}

// 用法：在应用初始化时调用 AuthServiceRegistry.registerAllAdapters()
// AuthServiceRegistry.registerAllAdapters();
