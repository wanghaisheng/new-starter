import { AuthServiceFactory } from '../infrastructure/auth/factory/auth-service-factory';
import { UserServiceFactory } from './user/factory/user-service-factory';
import { MatchServiceRegistry } from './deprecated/match/registry/match-service-registry';
import { MessageServiceFactory } from './deprecated/messages/factory/message-service-factory';
import { QuizServiceFactory } from './deprecated/quiz/factory/quiz-service-factory';
import { NotificationServiceFactory } from '../infrastructure/notifications/factory/notification-service-factory';
import { PaymentService } from '../infrastructure/payment/service/payment-service';
import type { IAuthService } from '../infrastructure/auth/types/auth-service';
import type { IUserService } from './user/types/user-service';
import type { IMatchService } from './deprecated/match/types/match-service';
import type { IMessageService } from './deprecated/messages/types/message-service';
import type { IQuizService, IQuizAIService, IQuizReportService } from './deprecated/quiz/types/quiz-service';
import type { INotificationService } from '../infrastructure/notifications/types/notification-service';
import { DataServiceRegistry } from '../data/registry/data-service-registry';

// AppService 统一管理所有业务服务实例，建议所有页面/组件仅通过 hooks 间接访问服务
export class AppService {
  private static instance: AppService;
  private initialized = false;

  private _authService?: IAuthService;
  private _userService?: IUserService;
  private _matchService?: IMatchService;
  private _messageService?: IMessageService;
  private _quizService?: IQuizService;
  private _quizAIService?: IQuizAIService;
  private _quizReportService?: IQuizReportService;
  private _notificationService?: INotificationService;
  private _paymentService?: PaymentService;

  private constructor() {}

  public static getInstance(): AppService {
    if (!AppService.instance) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }

  /**
   * 初始化所有业务服务
   * @param env 可配置各服务 type 及 baseUrl
   */
  public initialize(env: {
    authType?: 'mock' | 'firebase' | 'better' | 'hybrid',
    userType?: 'mock' | 'remote' | 'hybrid',
    matchType?: 'mock' | 'remote' | 'hybrid',
    messageType?: 'mock' | 'remote' | 'hybrid',
    notificationType?: 'mock' | 'remote' | 'hybrid',
    apiBaseUrl?: string,
    quizAdapterType?: 'mock' | 'db' | 'remote',
    quizApiBaseUrl?: string,
    quizAIBaseUrl?: string,
    paymentType?: 'revenuecat' | 'capacitor-purchases';
  }) {
    if (this.initialized) return;
    this._authService = AuthServiceFactory.createService(env.authType || 'mock');
    this._userService = UserServiceFactory.createService(env.userType || 'mock', env.apiBaseUrl);
    // 修复：为 matchService 注入 dataService，避免因缺失参数报错
    const matchDataService = DataServiceRegistry.get('default');
    this._matchService = MatchServiceRegistry.getInstance().createService(
      env.matchType || 'mock',
      'default',
      matchDataService
    );
    this._messageService = MessageServiceFactory.createService(env.messageType || 'mock');
    this._notificationService = NotificationServiceFactory.createService(env.notificationType || 'mock');

    // quiz adapter 动态选择
    let quizAdapter;
    switch (env.quizAdapterType) {
      case 'db':
        quizAdapter = new (require('./quiz/adapters/db-quiz-adapter').DbQuizAdapter)({});
        break;
      case 'remote':
        quizAdapter = new (require('./quiz/adapters/remote-quiz-adapter').RemoteQuizAdapter)();
        break;
      case 'mock':
      default:
        quizAdapter = new (require('./quiz/adapters/mock-quiz-adapter').MockQuizAdapter)();
    }
    this._quizService = QuizServiceFactory.createQuizService(quizAdapter);
    this._quizAIService = QuizServiceFactory.createQuizAIService(env.quizAIBaseUrl || '');
    this._quizReportService = QuizServiceFactory.createQuizReportService();
    this._paymentService = new PaymentService(env.paymentType || 'revenuecat');
    this.initialized = true;
  }

  public get authService(): IAuthService {
    if (!this._authService) throw new Error('AppService not initialized');
    return this._authService;
  }
  public get userService(): IUserService {
    if (!this._userService) throw new Error('AppService not initialized');
    return this._userService;
  }
  public get matchService(): IMatchService {
    if (!this._matchService) throw new Error('AppService not initialized');
    return this._matchService;
  }
  public get messageService(): IMessageService {
    if (!this._messageService) throw new Error('AppService not initialized');
    return this._messageService;
  }
  public get notificationService(): INotificationService {
    if (!this._notificationService) throw new Error('AppService not initialized');
    return this._notificationService;
  }
  public get quizService(): IQuizService {
    if (!this._quizService) throw new Error('AppService not initialized');
    return this._quizService;
  }
  public get quizAIService(): IQuizAIService {
    if (!this._quizAIService) throw new Error('AppService not initialized');
    return this._quizAIService;
  }
  public get quizReportService(): IQuizReportService {
    if (!this._quizReportService) throw new Error('AppService not initialized');
    return this._quizReportService;
  }
  public get paymentService(): PaymentService {
    if (!this._paymentService) throw new Error('AppService not initialized');
    return this._paymentService;
  }
}
