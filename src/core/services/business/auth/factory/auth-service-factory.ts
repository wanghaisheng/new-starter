// 认证服务工厂，统一为 class + static createService 方法
import { IAuthService } from '../types/auth-service';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { FirebaseAuthService } from '../adapters/firebase/firebase-auth-service';
import { BetterAuthService } from '../adapters/better/better-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';

export class AuthServiceFactory {
  static createService(type: 'mock'|'firebase'|'better'|'hybrid' = 'mock'): IAuthService {
    switch(type) {
      case 'firebase': return new FirebaseAuthService() as IAuthService;
      case 'better': return new BetterAuthService() as IAuthService;
      case 'hybrid': return new HybridAuthService() as IAuthService;
      default: return new MockAuthService() as IAuthService;
    }
  }
}

export type AuthServiceConfig = {
  environment: 'production'|'test'|'mock',
  name: string,
  type?: 'mock'|'firebase'|'better'|'hybrid'
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
    switch (config.type ?? (config.environment === 'production' ? 'firebase' : 'mock')) {
      case 'firebase': service = new FirebaseAuthService(); break;
      case 'better': service = new BetterAuthService(); break;
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
