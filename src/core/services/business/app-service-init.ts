import { AppService } from './app-service';
import { getConfigService } from '@/core/services/infrastructure/config';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import { AuthServiceType, NotificationServiceType, MatchServiceType, MessageType, MessageEnhancerType, QuizType, QuizEnhancerType } from '@/core/lib/db/types/common';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { UserService } from './user/user-service';
import { MatchService } from './match/match-service';
import { RandomMatchAdapter } from './match/ai-adapters/random-match-adapter';
import { CompositeMatchAdapter } from './match/ai-adapters/composite-match-adapter';
import { MessageService, MessageServiceConfig } from './new-messages/service/message-service';
import { MessageRepository } from '@/core/lib/db/repositories/impl/message-repository';
// 动态导入所有 enhancer
import { AIEnhancer } from './new-messages/enhancers/ai-enhancer';
import { AuditEnhancer } from './new-messages/enhancers/audit-enhancer';
import { ContentSafetyEnhancer } from './new-messages/enhancers/content-safety-enhancer';
import { EncryptionEnhancer } from './new-messages/enhancers/encryption-enhancer';
import { I18nEnhancer } from './new-messages/enhancers/i18n-enhancer';
import { MediaEnhancer } from './new-messages/enhancers/media-enhancer';
import { MultiDeviceSyncEnhancer } from './new-messages/enhancers/multi-device-sync-enhancer';
import { PriorityGroupEnhancer } from './new-messages/enhancers/priority-group-enhancer';
import { RecallEditEnhancer } from './new-messages/enhancers/recall-edit-enhancer';
import { TeenSafetyEnhancer } from './new-messages/enhancers/teen-safety-enhancer';

// Quiz Enhancers 示例（如需具体实现可继续扩展）
class BasicReportEnhancer { /* ... */ }
class AIAnalysisEnhancer { /* ... */ }

// PhotoService 示例（如需具体实现可继续扩展）
import { PhotoOnboardService } from './photo/onboard/onboard-service';

export async function initAppService() {
  const configService = getConfigService();
  const logger = LoggerService.getInstance();
  const dataService = DataServiceRegistry.get('default');
  const userService = new UserService();
  const photoOnboardService = new PhotoOnboardService();

  // 多算法匹配适配器组合
  const matchTypesRaw = configService.get('NEXT_PUBLIC_MATCH_SERVICE_TYPE') || ['random'];
  const matchTypeList = Array.isArray(matchTypesRaw)
    ? matchTypesRaw
    : typeof matchTypesRaw === 'string'
      ? matchTypesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : ['random'];

  const matchAdapters = matchTypeList.map(type => {
    switch (type) {
      case MatchServiceType.COMPOSITE:
        return new CompositeMatchAdapter(configService);
      case MatchServiceType.RANDOM:
        return new RandomMatchAdapter();
      // 可继续扩展其它算法适配器
      default:
        return new RandomMatchAdapter();
    }
  });

  // 假设 MatchService 构造函数支持注入 adapters 参数
  const matchService = new MatchService(
    dataService,
    configService,
    userService,
    undefined, // settingService 可选
    { adapters: matchAdapters }
  );

  // 消息类型（单一值）与增强器链配置
  const messageType = configService.get('NEXT_PUBLIC_MESSAGE_TYPE') || MessageType.TEXT;
  if (!Object.values(MessageType).includes(messageType)) {
    throw new Error(`[AppServiceInit] 无效的消息类型: ${messageType}`);
  }
  const enhancerRaw = configService.get('NEXT_PUBLIC_MESSAGE_FEATURES') || [];
  const enhancerList = Array.isArray(enhancerRaw)
    ? enhancerRaw
    : typeof enhancerRaw === 'string'
      ? enhancerRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  const enhancerMap = {
    [MessageEnhancerType.AI]: () => new AIEnhancer(),
    [MessageEnhancerType.AUDIT]: () => new AuditEnhancer(),
    [MessageEnhancerType.CONTENT_SAFETY]: () => new ContentSafetyEnhancer(),
    [MessageEnhancerType.ENCRYPTION]: () => new EncryptionEnhancer(),
    [MessageEnhancerType.I18N]: () => new I18nEnhancer(),
    [MessageEnhancerType.MEDIA]: () => new MediaEnhancer(),
    [MessageEnhancerType.MULTI_DEVICE_SYNC]: () => new MultiDeviceSyncEnhancer(),
    [MessageEnhancerType.PRIORITY_GROUP]: () => new PriorityGroupEnhancer(),
    [MessageEnhancerType.RECALL_EDIT]: () => new RecallEditEnhancer(),
    [MessageEnhancerType.TEEN_SAFETY]: () => new TeenSafetyEnhancer(),
  };
  const enhancers = enhancerList.map(key => enhancerMap[key as MessageEnhancerType]?.()).filter(Boolean);
  const messageConfig: MessageServiceConfig = { messageType, features: enhancerList };
  const messageRepository = new MessageRepository(dataService);
  const messageService = new MessageService(
    messageRepository,
    messageConfig,
    enhancers,
  );

  // Quiz 类型与增强器链配置
  const quizType = configService.get('NEXT_PUBLIC_QUIZ_TYPE') || QuizType.MBTI;
  if (!Object.values(QuizType).includes(quizType)) {
    throw new Error(`[AppServiceInit] 无效的测评类型: ${quizType}`);
  }
  const quizEnhancerRaw = configService.get('NEXT_PUBLIC_QUIZ_FEATURES') || [];
  const quizEnhancerList = Array.isArray(quizEnhancerRaw)
    ? quizEnhancerRaw
    : typeof quizEnhancerRaw === 'string'
      ? quizEnhancerRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  const quizEnhancerMap = {
    [QuizEnhancerType.BASIC_REPORT]: () => new BasicReportEnhancer(),
    [QuizEnhancerType.AI_ANALYSIS]: () => new AIAnalysisEnhancer(),
  };
  const quizEnhancers = quizEnhancerList.map(key => quizEnhancerMap[key as QuizEnhancerType]?.()).filter(Boolean);
  // quizService 初始化可参考 messageService

  const serviceConfig = {
    authType: (configService.get('NEXT_PUBLIC_AUTH_SERVICE_TYPE') as AuthServiceType) || AuthServiceType.MOCK,
    userType: configService.get('NEXT_PUBLIC_USER_SERVICE_TYPE') || 'mock',
    notificationType: (configService.get('NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE') as NotificationServiceType) || NotificationServiceType.MOCK,
    paymentType: configService.get('NEXT_PUBLIC_PAYMENT_SERVICE_TYPE') || 'revenuecat',
    apiBaseUrl: configService.get('NEXT_PUBLIC_API_BASE_URL'),
    matchService,
    messageService,
    userService,
    photoOnboardService,
    // quizService,
  };

  logger.info('[AppServiceInit] 初始化配置', serviceConfig);
  await AppService.getInstance().initialize(serviceConfig);

  setInterval(() => {
    const latestConfig = {
      ...serviceConfig,
      authType: (configService.get('NEXT_PUBLIC_AUTH_SERVICE_TYPE') as AuthServiceType) || AuthServiceType.MOCK,
      userType: configService.get('NEXT_PUBLIC_USER_SERVICE_TYPE') || 'mock',
      notificationType: (configService.get('NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE') as NotificationServiceType) || NotificationServiceType.MOCK,
      paymentType: configService.get('NEXT_PUBLIC_PAYMENT_SERVICE_TYPE') || 'revenuecat',
      apiBaseUrl: configService.get('NEXT_PUBLIC_API_BASE_URL'),
    };
    logger.info('[AppServiceInit] 热更新配置', latestConfig);
  }, 1000 * 60 * 5);
}