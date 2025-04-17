import { BaseFactory } from '../../factory/base-factory';
import { IAuthService } from '../types/auth-service';
import { ServiceConfig } from '../../types/config';
import { logger } from '@/core/lib/logger';

/**
 * 认证服务工厂
 */
export class AuthFactory extends BaseFactory<IAuthService> {
  private static instance: AuthFactory | null = null;

  private constructor() {
    super();
  }

  /**
   * 获取工厂实例
   */
  public static getInstance(): AuthFactory {
    if (!AuthFactory.instance) {
      AuthFactory.instance = new AuthFactory();
    }
    return AuthFactory.instance;
  }

  /**
   * 创建认证服务实例
   */
  public async createService(config: ServiceConfig): Promise<IAuthService> {
    const { environment, name } = config;

    // 根据环境创建不同的认证服务
    let service: IAuthService;
    switch (environment) {
      case 'development':
        service = await this.createMockAuthService(config);
        break;
      case 'test':
        service = await this.createFirebaseAuthService(config);
        break;
      case 'production':
        service = await this.createBetterAuthService(config);
        break;
      default:
        throw new Error(`Unsupported environment: ${environment}`);
    }

    this.instances.set(name, service);
    logger.info(`Auth service '${name}' created for environment '${environment}'`);

    return service;
  }

  /**
   * 创建 Mock 认证服务
   */
  private async createMockAuthService(config: ServiceConfig): Promise<IAuthService> {
    const { MockAuthService } = await import('../adapters/mock/mock-auth-service');
    return new MockAuthService(config);
  }

  /**
   * 创建 Firebase 认证服务
   */
  private async createFirebaseAuthService(config: ServiceConfig): Promise<IAuthService> {
    const { FirebaseAuthService } = await import('../adapters/firebase/firebase-auth-service');
    return new FirebaseAuthService(config);
  }

  /**
   * 创建 Better 认证服务
   */
  private async createBetterAuthService(config: ServiceConfig): Promise<IAuthService> {
    const { BetterAuthService } = await import('../adapters/better/better-auth-service');
    return new BetterAuthService(config);
  }
} 