import { AppService, AppServiceConfig } from './app-service';
import { getConfigService } from '@/core/services/infrastructure/config';
import { CONFIG_KEYS } from '@/core/services/infrastructure/config/config-keys';
// 引入各业务服务插件工厂和注册表
import { MessageService } from './messages/service/message-service';
import { QuizService } from './quiz/service/quiz-service';
import { MatchService } from './match/match-service';
import { OnboardService } from './onboard/service/onboard-service';
import { MessageEnhancerType, QuizEnhancerType } from '@/core/lib/db/types/common';

// ==== 获取配置服务实例 ====
const configService = getConfigService();

// ==== 动态注册插件式能力（adapter/enhancer）====
import * as messageEnhancers from '@core/services/business/messages/enhancers';
import * as quizEnhancers from '@core/services/business/quiz/enhancers';
import { getEnhancers as getMatchEnhancers } from '@core/services/business/match/enhancers';
import * as onboardEnhancers from '@core/services/business/onboard/enhancers';

// 消息服务增强器映射（基于枚举类型）
const messageEnhancerMap = {
  [MessageEnhancerType.AI]: () => new messageEnhancers.AIEnhancer(),
  [MessageEnhancerType.AUDIT]: () => new messageEnhancers.AuditEnhancer(),
  [MessageEnhancerType.CONTENT_SAFETY]: () => new messageEnhancers.ContentSafetyEnhancer(),
  [MessageEnhancerType.ENCRYPTION]: () => new messageEnhancers.EncryptionEnhancer(),
  [MessageEnhancerType.RECALL_EDIT]: () => new messageEnhancers.RecallEditEnhancer(),
  [MessageEnhancerType.I18N]: () => new messageEnhancers.I18nEnhancer(),
  [MessageEnhancerType.MEDIA]: () => new messageEnhancers.MediaEnhancer(),
  [MessageEnhancerType.PRIORITY_GROUP]: () => new messageEnhancers.PriorityGroupEnhancer(),
  [MessageEnhancerType.TEEN_SAFETY]: () => new messageEnhancers.TeenSafetyEnhancer(),
  [MessageEnhancerType.MULTI_DEVICE_SYNC]: () => new messageEnhancers.MultiDeviceSyncEnhancer(),
  // ...如有新增增强器请补充
};

// 测验服务增强器映射
const quizEnhancerMap = {
  [QuizEnhancerType.BASIC_REPORT]: () => new quizEnhancers.DemoEnhancer(),
  // ...如有新增增强器请补充
};

// 匹配服务增强器映射（通过工厂函数动态创建）
const matchEnhancerList = configService.get(CONFIG_KEYS.NEXT_PUBLIC_MATCH_TYPE) || [];
const matchEnhancerMap = getMatchEnhancers ? getMatchEnhancers(Array.isArray(matchEnhancerList) ? matchEnhancerList : matchEnhancerList.split(',').map(s => s.trim()).filter(Boolean)) : {};

// 引导服务增强器映射
const onboardEnhancerMap = {
  abtest: () => new onboardEnhancers.ABTestEnhancer(),
  grayrelease: () => new onboardEnhancers.GrayReleaseEnhancer(),
  i18n: () => new onboardEnhancers.I18nEnhancer(),
  // ...如有新增增强器请补充
};

// ==== 初始化各业务服务实例，注入插件式能力 ====
// 动态获取各业务服务初始化参数（使用CONFIG_KEYS常量替代硬编码字符串）

// 消息服务配置
const messageType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_MESSAGE_TYPE) || 'text';
const messageFeatures = configService.get(CONFIG_KEYS.NEXT_PUBLIC_MESSAGE_FEATURES) || '';
const messageRepositoryMap = configService.get('MESSAGE_REPOSITORY_MAP') || {};

// 测验服务配置
const quizType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_QUIZ_TYPE) || 'default';
const quizFeatures = configService.get(CONFIG_KEYS.NEXT_PUBLIC_QUIZ_FEATURES) || '';
const quizAdapterMap = configService.get('QUIZ_ADAPTER_MAP') || {};

// 引导服务配置
const onboardType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_ONBOARD_TYPE) || 'default';
const onboardAdapterMap = configService.get('ONBOARD_ADAPTER_MAP') || {};

// 匹配服务配置
const matchType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_MATCH_TYPE) || '';
const matchDataService = configService.get('DATA_SERVICE');
const matchUserService = configService.get('USER_SERVICE');
const matchSettingService = configService.get('SETTING_SERVICE');

// 类型校验与默认值处理
if (!messageRepositoryMap || Object.keys(messageRepositoryMap).length === 0) {
  console.warn('MESSAGE_REPOSITORY_MAP 配置缺失或为空，将使用默认配置');
}

if (!quizAdapterMap || Object.keys(quizAdapterMap).length === 0) {
  console.warn('QUIZ_ADAPTER_MAP 配置缺失或为空，将使用默认配置');
}

if (!matchDataService) {
  console.warn('DATA_SERVICE 配置缺失，匹配服务可能无法正常工作');
}

// 创建消息服务实例
const messageService = new MessageService(
  configService,
  messageRepositoryMap,
  messageEnhancerMap
);

// 创建测验服务实例
const quizService = new QuizService(
  configService,
  quizAdapterMap,
  quizEnhancerMap
);

// 创建匹配服务实例
const matchService = new MatchService(
  matchDataService,
  configService,
  matchUserService,
  matchSettingService
);

// 创建引导服务实例
const onboardService = new OnboardService(
  configService,
  onboardAdapterMap,
  onboardEnhancerMap
);

// 记录服务初始化完成
console.info('[business-service-init] 业务服务初始化完成');

// ==== 组装全局服务配置，注入插件式能力 ====
const appService = AppService.getInstance();
await appService.initialize({
  configService,
  messageService,
  quizService,
  matchService,
  onboardService,
  messageEnhancerMap,
  quizEnhancerMap,
  matchEnhancerMap,
  onboardEnhancerMap
});

// ==== 导出各业务服务实例，供全局使用 ====
export { messageService, quizService, matchService, onboardService };
export const authService = appService.getAuthService();
export const userService = appService.getUserService();
export const notificationService = appService.getNotificationService();
export const paymentService = appService.getPaymentService();
// 如有新增业务服务类型，请在此处统一导出
// 可在此处通过 configService.get('KEY') 获取各服务初始化参数