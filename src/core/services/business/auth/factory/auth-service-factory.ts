// 认证服务工厂，统一为 class + static createService 方法
import { IAuthService } from '../types/auth-service';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';
import { PersistentMockAuthService } from '../adapters/mock/persistent-mock-auth-service';
import { configService } from '@/core/services/infrastructure/config';

export type AuthServiceType = 'mock' | 'persistent-mock' | 'firebase' | 'better' | 'hybrid';
export type AuthServiceOptions = { [key: string]: any };

// 自动根据环境变量决定默认类型
function getDefaultAuthType(): AuthServiceType {
  const authType = configService.get('NEXT_PUBLIC_AUTH_TYPE');
  if (authType) {
    return authType as AuthServiceType;
  }
  const nodeEnv = configService.get('NODE_ENV');
  if (nodeEnv === 'production') {
    return 'firebase';
  }
  return 'mock';
}

export class AuthServiceFactory {
  static createService({
    type,
    dataService,
    options = {}
  }: {
    type?: AuthServiceType,
    dataService?: any,
    options?: AuthServiceOptions
  } = {}): IAuthService {
    const resolvedType = type || getDefaultAuthType();
    console.log('[DEBUG][auth-service-factory] 创建 auth 类型:', resolvedType);
    switch(resolvedType) {
      case 'persistent-mock':
        return new PersistentMockAuthService();
      case 'firebase': {
        // 动态 require，避免 mock 环境下 firebase-adapter 被静态 import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { FirebaseAuthAdapter } = require('../adapters/firebase/firebase-auth-service');
        return new FirebaseAuthAdapter();
      }
      case 'better': {
        // 动态 require，避免 mock 环境下 better-auth-adapter 被静态 import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BetterAuthService } = require('../adapters/better/better-auth-service');
        return new BetterAuthService();
      }
      case 'hybrid': return new HybridAuthService();
      default: return new MockAuthService();
    }
  }
}

export type AuthServiceConfig = {
  environment: 'production'|'test'|'mock',
  name: string,
  type?: AuthServiceType
};

export class AuthServiceFactoryRegistry {
  private static instance: AuthServiceFactoryRegistry;
  private registry: Record<string, IAuthService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new AuthServiceFactoryRegistry();
    return this.instance;
  }

  createService(config: AuthServiceConfig): IAuthService {
    const key = `${config.environment}:${config.name}`;
    if (this.registry[key]) return this.registry[key];
    let service: IAuthService;
    console.log('[DEBUG][auth-service-factory] 创建 auth 类型:', config.type ?? (config.environment === 'production' ? 'firebase' : 'mock'));
    switch (config.type ?? (config.environment === 'production' ? 'firebase' : 'mock')) {
      case 'firebase': {
        // 动态 require，避免 mock 环境下 firebase-adapter 被静态 import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { FirebaseAuthAdapter } = require('../adapters/firebase/firebase-auth-service');
        service = new FirebaseAuthAdapter();
        break;
      }
      case 'better': {
        // 动态 require，避免 mock 环境下 better-auth-adapter 被静态 import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BetterAuthService } = require('../adapters/better/better-auth-service');
        service = new BetterAuthService();
        break;
      }
      case 'hybrid': service = new HybridAuthService(); break;
      default: service = new MockAuthService();
    }
    this.registry[key] = service;
    return service;
  }

  getService(environment: string, name: string): IAuthService | undefined {
    return this.registry[`${environment}:${name}`];
  }

  clear() {
    this.registry = {};
  }
}
