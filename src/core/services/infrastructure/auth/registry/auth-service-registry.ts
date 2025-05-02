// 认证服务注册表/单例工厂，支持多类型多实例注册与获取，并内置适配器注册机制
import type { IAuthService } from '../types/auth-service';
import { AuthServiceFactory } from '../factory/auth-service-factory';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';
import { AuthStrategy, AuthProvider } from '@/core/lib/db/types/common';
import { AUTH_KEYS } from '@/core/services/infrastructure/config/config-keys';

export interface AuthServiceConfig {
  environment: string;
  name: string;
  strategy: AuthStrategy;
  provider: AuthProvider;
}

export class AuthServiceRegistry {
  private static instance: AuthServiceRegistry;
  private registry: Record<string, IAuthService> = {};
  private static adapters: Partial<Record<AuthStrategy, () => IAuthService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new AuthServiceRegistry();
    return this.instance;
  }

  getProvider(
    strategy: AuthStrategy = AuthStrategy.Mock,
    provider: AuthProvider = AuthProvider.Mock,
    name: string = 'default',
    dataService?: any,
    options?: { [key: string]: any }
  ): () => IAuthService {
    return () => this.createService(strategy, provider, name, dataService, options);
  }

  createService(
    strategy: AuthStrategy = AuthStrategy.Mock,
    provider: AuthProvider = AuthProvider.Mock,
    name: string = 'default',
    dataService?: any,
    options?: { [key: string]: any }
  ): IAuthService {
    const key = `${strategy}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = AuthServiceRegistry.adapters[strategy];
    const service = adapter
      ? adapter()
      : AuthServiceFactory.createService({
          strategy,
          provider,
          dataService,
          options
        });
    this.registry[key] = service;
    return service;
  }

  static registerAllAdapters() {
    AuthServiceRegistry.registerAdapter(AuthStrategy.Mock, () => new MockAuthService());
    AuthServiceRegistry.registerAdapter(AuthStrategy.jwt, () => {
      // 动态 require，避免 mock 环境下 firebase-adapter 被静态 import
      const { FirebaseAuthAdapter } = require('../adapters/firebase/firebase-auth-service');
      return new FirebaseAuthAdapter();
    });
    AuthServiceRegistry.registerAdapter(AuthStrategy.OAuth, () => {
      // 动态 require，避免 mock 环境下 better-auth-adapter 被静态 import
      const { BetterAuthService } = require('../adapters/better/better-auth-service');
      return new BetterAuthService();
    });
    AuthServiceRegistry.registerAdapter(AuthStrategy.Session, () => new HybridAuthService());
  }
}
}

  clear(): void {
    this.registry = {};
  }
}

  getService(strategy: AuthStrategy, name: string = 'default'): IAuthService | undefined {
    return this.registry[`${strategy}:${name}`];
  }

  static registerAdapter(strategy: AuthStrategy, factory: () => IAuthService): void {
    AuthServiceRegistry.adapters[strategy] = factory;
  }

  static getAdapter(strategy: AuthStrategy): (() => IAuthService) | undefined {
    return AuthServiceRegistry.adapters[strategy];
  }

  static unregisterAdapter(strategy: AuthStrategy): void {
    delete AuthServiceRegistry.adapters[strategy];
  }

  getDefaultService(dataService?: any, options?: { [key: string]: any }): IAuthService {
    // 从配置服务获取认证策略和提供者
    const configService = AuthServiceFactory.getConfigService();
    const resolvedStrategy = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_STRATEGY) 
      ?? AuthStrategy.Mock;

    const resolvedProvider = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_PROVIDER) 
      ?? AuthProvider.Mock;

    return this.createService(resolvedStrategy, resolvedProvider, 'default', dataService, options);
  }

  clear(): void {
    this.registry = {};
  }
}
