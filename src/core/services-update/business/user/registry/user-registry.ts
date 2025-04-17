import { BaseServiceRegistry } from '../../registry/base-service-registry';
import { IUserService } from '../types/user-service';
import { ServiceConfig } from '../../types/config';
import { MockUserService } from '../adapters/mock/mock-user-service';
import { FirebaseUserService } from '../adapters/firebase/firebase-user-service';
import { BetterUserService } from '../adapters/better/better-user-service';
import { logger } from '@/core/lib/logger';

/**
 * 用户服务注册表
 */
export class UserServiceRegistry extends BaseServiceRegistry<IUserService> {
  private static instance: UserServiceRegistry;

  private constructor() {
    super();
    this.registerProvider('mock', MockUserService);
    this.registerProvider('firebase', FirebaseUserService);
    this.registerProvider('better', BetterUserService);
  }

  /**
   * 获取注册表实例
   */
  public static getInstance(): UserServiceRegistry {
    if (!UserServiceRegistry.instance) {
      UserServiceRegistry.instance = new UserServiceRegistry();
    }
    return UserServiceRegistry.instance;
  }

  /**
   * 获取服务提供者
   */
  public getProvider(type: string): (new (config: ServiceConfig) => IUserService) | undefined {
    return this.providers.get(type);
  }

  /**
   * 注册服务提供者
   */
  public registerProvider(type: string, provider: new (config: ServiceConfig) => IUserService): void {
    this.providers.set(type, provider);
    logger.info(`Registered user service provider: ${type}`);
  }

  /**
   * 注销服务提供者
   */
  public unregisterProvider(type: string): void {
    this.providers.delete(type);
    logger.info(`Unregistered user service provider: ${type}`);
  }
} 