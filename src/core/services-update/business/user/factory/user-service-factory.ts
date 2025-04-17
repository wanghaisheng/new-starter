import { BaseServiceFactory } from '../../factory/base-service-factory';
import { IUserService } from '../types/user-service';
import { ServiceConfig } from '../../types/config';
import { MockUserService } from '../adapters/mock/mock-user-service';
import { FirebaseUserService } from '../adapters/firebase/firebase-user-service';
import { BetterUserService } from '../adapters/better/better-user-service';
import { logger } from '@/core/lib/logger';

/**
 * 用户服务工厂
 */
export class UserServiceFactory extends BaseServiceFactory<IUserService> {
  private static instance: UserServiceFactory;

  private constructor() {
    super();
  }

  /**
   * 获取工厂实例
   */
  public static getInstance(): UserServiceFactory {
    if (!UserServiceFactory.instance) {
      UserServiceFactory.instance = new UserServiceFactory();
    }
    return UserServiceFactory.instance;
  }

  /**
   * 创建服务实例
   */
  protected createInstance(config: ServiceConfig): IUserService {
    if (!config.user) {
      throw new Error('User service configuration is required');
    }

    let service: IUserService;
    switch (config.user.type) {
      case 'mock':
        service = new MockUserService(config);
        break;
      case 'firebase':
        if (!config.user.apiKey || !config.user.authDomain || !config.user.projectId) {
          throw new Error('Firebase configuration is incomplete');
        }
        service = new FirebaseUserService(config);
        break;
      case 'better':
        if (!config.user.secret || !config.user.databaseUrl || !config.user.authToken) {
          throw new Error('Better configuration is incomplete');
        }
        service = new BetterUserService(config);
        break;
      default:
        throw new Error(`Unsupported user service type: ${config.user.type}`);
    }

    logger.info(`Created user service instance: ${config.user.type}`);
    return service;
  }
} 