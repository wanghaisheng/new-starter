import { BaseRegistry } from '@/core/services-update/infrastructure/registry/base-registry';
import { IAuthService } from '../types/auth-service';
import { logger } from '@/core/lib/logger';

/**
 * 认证服务注册表
 */
export class AuthRegistry extends BaseRegistry<IAuthService> {
  private static instance: AuthRegistry | null = null;

  private constructor() {
    super();
  }

  /**
   * 获取注册表实例
   */
  public static getInstance(): AuthRegistry {
    if (!AuthRegistry.instance) {
      AuthRegistry.instance = new AuthRegistry();
    }
    return AuthRegistry.instance;
  }

  /**
   * 注册认证服务
   */
  public registerAuthService(name: string, service: IAuthService): void {
    this.registerService(name, service);
    logger.info(`Auth service '${name}' registered`);
  }

  /**
   * 获取认证服务
   */
  public getAuthService(name: string): IAuthService | undefined {
    return this.getService(name);
  }

  /**
   * 获取所有认证服务
   */
  public getAllAuthServices(): IAuthService[] {
    return this.getAllServices();
  }

  /**
   * 移除认证服务
   */
  public removeAuthService(name: string): void {
    this.removeService(name);
    logger.info(`Auth service '${name}' removed`);
  }

  /**
   * 清空所有认证服务
   */
  public clearAuthServices(): void {
    this.clearServices();
    logger.info('All auth services cleared');
  }
} 