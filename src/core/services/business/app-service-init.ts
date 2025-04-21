// 新架构 AppService 入口初始化脚本
import { AppService } from './app-service';

/**
 * 初始化新版 AppService 并支持远程配置热更新
 * 支持自动根据环境变量注入各业务服务类型
 */
export async function initAppService() {
  const serviceConfig = {
    authType: process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE as any || 'mock',
    userType: process.env.NEXT_PUBLIC_USER_SERVICE_TYPE as any || 'mock',
    matchType: process.env.NEXT_PUBLIC_MATCH_SERVICE_TYPE as any || 'mock',
    messageType: process.env.NEXT_PUBLIC_MESSAGE_SERVICE_TYPE as any || 'mock',
    notificationType: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE as any || 'mock',
    paymentType: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_TYPE as any || 'revenuecat',
    quizAdapterType: process.env.NEXT_PUBLIC_QUIZ_SERVICE_TYPE as any || 'mock',
    quizApiBaseUrl: process.env.NEXT_PUBLIC_QUIZ_API_BASE_URL,
    quizAIBaseUrl: process.env.NEXT_PUBLIC_QUIZ_AI_BASE_URL,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL
  };

  await AppService.getInstance().initialize(serviceConfig);

  // 启动远程配置定时热更新（每30分钟）
  setInterval(() => {
    AppService.getInstance().initialize(serviceConfig);
  }, 1000 * 60 * 30);
}

// 若需立即调用（如入口直接引入）可取消注释
// initAppService();
