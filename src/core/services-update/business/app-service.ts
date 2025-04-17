// 新版 AppService：纯基于新架构，移除旧 data 依赖，集成新版工厂/注册表/远程配置
import { AuthFactory } from './auth/factory/auth-factory';
import { UserServiceFactory } from './user/factory/user-service-factory';
import { MatchServiceFactory } from './match/factory/match-service-factory';
import { MessageServiceFactory } from './messages/factory/message-service-factory';
import { fetchAndRegisterPhoneServices } from './phone/phone-service-remote-config';

/**
 * 新架构 AppService
 * 负责统一初始化所有新版业务服务，集成端能力自动适配与远程热更新
 */
export class AppService {
  private static instance: AppService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AppService {
    if (!AppService.instance) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }

  /**
   * 新架构统一初始化
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('AppService already initialized');
      return;
    }
    try {
      // 1. 端能力自动注册与热更新（phone能力）
      await fetchAndRegisterPhoneServices('/api/phone-brand-rules.json');
      // 2. 初始化认证服务（如 Firebase/Better/Mock）
      await AuthFactory.getInstance().createService({ environment: 'production', name: 'default' });
      // 3. 初始化用户服务
      UserServiceFactory.getInstance(); // 可按需 createService
      // 4. 初始化消息、匹配等其它业务服务
      // MessageServiceFactory.getProvider('mock');
      // MatchServiceFactory.getProvider('mock');
      // ...如有其它业务服务，可在此统一初始化
      this.initialized = true;
      console.log('AppService (new architecture) initialization complete');
    } catch (error) {
      console.error('Failed to initialize AppService:', error);
      throw error;
    }
  }
}
