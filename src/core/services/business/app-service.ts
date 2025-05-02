import type { IAuthService } from '../infrastructure/auth/types/auth-service';
import type { IUserService } from './user/types/user-service';
import type { INotificationService } from '../infrastructure/notifications/types/notification-service';
import { AuthServiceFactory } from '../infrastructure/auth/factory/auth-service-factory';
import { NotificationServiceFactory } from '../infrastructure/notifications/factory/notification-service-factory';
import { UserService } from './user/user-service';
import { PaymentService } from '../infrastructure/payment/service/payment-service';
import { MatchService } from './match/match-service';
import { MessageService } from './messages/service/message-service';
import { QuizService } from './quiz/service/quiz-service';
import type { AuthServiceType, NotificationServiceType } from '@/core/lib/db/types/common';

export interface AppServiceConfig {
  authType: AuthServiceType;
  userType: string;
  notificationType: NotificationServiceType;
  paymentType: string;
  apiBaseUrl?: string;
  matchService?: MatchService;
  messageService?: MessageService;
  quizService?: QuizService;
  userService?: UserService;
  onboardService?: any;
  configService?: any;
  messageRepositoryMap?: any;
  quizAdapterMap?: any;
  onboardAdapterMap?: any;
  dataService?: any;
  settingService?: any;
  // 新增插件式能力和更多业务服务类型支持
  messageEnhancerMap?: any;
  quizEnhancerMap?: any;
  matchEnhancerMap?: any;
  onboardEnhancerMap?: any;
  [key: string]: any;
}

export class AppService {
  private static instance: AppService;
  private initialized = false;
  private config?: AppServiceConfig;

  private _authService?: IAuthService;
  private _userService?: IUserService;
  private _notificationService?: INotificationService;
  private _paymentService?: PaymentService;
  private _matchService?: MatchService;
  private _messageService?: MessageService;
  private _quizService?: QuizService;

  private constructor() {}

  public static getInstance(): AppService {
    if (!AppService.instance) AppService.instance = new AppService();
    return AppService.instance;
  }

  public async initialize(config: AppServiceConfig) {
    if (this.initialized && JSON.stringify(this.config) === JSON.stringify(config)) return;
    this.config = config;
    // 认证、通知服务支持工厂（如需多实现切换）
    this._authService = AuthServiceFactory.createService({ type: config.authType });
    this._notificationService = NotificationServiceFactory.createService({ type: config.notificationType });
    // 直接注入已初始化好的业务服务实例
    this._userService = config.userService || new UserService();
    this._paymentService = new PaymentService(config.paymentType);
    this._matchService = config.matchService;
    this._messageService = config.messageService;
    this._quizService = config.quizService;
    // 新增 onboardService 支持
    (this as any)._onboardService = config.onboardService;
    // 可扩展更多业务服务和插件式能力注入
    this.initialized = true;
  }

  public getAuthService(): IAuthService | undefined { return this._authService; }
  public getUserService(): IUserService | undefined { return this._userService; }
  public getNotificationService(): INotificationService | undefined { return this._notificationService; }
  public getPaymentService(): PaymentService | undefined { return this._paymentService; }
  public getMatchService(): MatchService | undefined { return this._matchService; }
  public getMessageService(): MessageService | undefined { return this._messageService; }
  public getQuizService(): QuizService | undefined { return this._quizService; }
  // 新增 onboardService 导出
  public getOnboardService(): any { return (this as any)._onboardService; }
}
