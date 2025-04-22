// core/services/init.ts
// 全局服务初始化入口，保证只初始化一次
import { getLoggerService } from './infrastructure/logger/registry/logger-registry';
import { getErrorService } from './infrastructure/error/registry/error-registry';
import { getNetworkManager } from './infrastructure/network/registry/network-registry';
import { UserServiceRegistry } from './business/user/registry/user-service-registry';
import { AuthServiceRegistry } from './business/auth/registry/auth-service-registry';
import { MatchServiceRegistry } from './business/match/registry/match-service-registry';
import { MessageServiceRegistry } from './business/messages/registry/message-service-registry';
import { NotificationServiceRegistry } from './business/notifications/registry/notification-service-registry';
import { PaymentServiceRegistry } from './business/payment/registry/payment-service-registry';
import { BluetoothServiceRegistry } from './business/phone/bluetooth/registry/bluetooth-service-registry';
import { CameraServiceRegistry } from './business/phone/camera/registry/camera-service-registry';
import { LocationServiceRegistry } from './business/phone/location/registry/location-service-registry';
import { NFCServiceRegistry } from './business/phone/nfc/registry/nfc-service-registry';
import { SensorServiceRegistry } from './business/phone/sensor/registry/sensor-service-registry';
import { QuizServiceRegistry } from './business/quiz/registry/quiz-service-registry';
import { imageServiceRegistry } from './business/image/registry/image-service-registry';
import { DataServiceRegistry } from './data/registry/data-service-registry';
// 自动检测补全
import { MockDataServiceRegistry } from './business/mock/registry/MockDataServiceRegistry';
import { ConfigRegistry } from './infrastructure/config/registry/config-registry';
import { createEmailService } from './infrastructure/email';
// ...如有更多 registry，按需补充

let initialized = false;

/**
 * initializeCoreServices
 * App 启动时调用，集中初始化所有核心服务（只执行一次，幂等）
 */
export async function initializeCoreServices() {
  if (initialized) return;
  initialized = true;
  // 基础设施服务
  getLoggerService();
  getErrorService();
  getNetworkManager();
  const dataService = DataServiceRegistry.get('default');
  await dataService?.initialize?.(); // 确保库表初始化
  console.log('[DataService] 初始化完成');
  // if (process.env.NODE_ENV !== 'production' && dataService?.loadMockData) {
    // try {
      // await dataService.loadMockData();
      // console.log('[DataService] Mock 数据已加载');
    // } catch (e) {
      // console.warn('[DataService] Mock 数据加载失败:', e);
    // }
  // }

  // 业务服务（全部通过 Registry 单例获取，禁止 Factory 直连）
  UserServiceRegistry.getInstance();
  AuthServiceRegistry.getInstance();
  if (!dataService) {
    throw new Error('[init] dataService 未初始化，MatchServiceRegistry 依赖 dataService！');
  }
  // 获取单例
  const configService = ConfigRegistry.getInstance();
  // 设置配置
  // 获取配置
const matchServiceOptions = configService.get('matchServiceOptions');
// 推荐方式：注册并获取实例
const matchService = MatchServiceRegistry.getInstance().createService('remote', 'default', dataService, matchServiceOptions);
  NotificationServiceRegistry.getInstance();
  PaymentServiceRegistry.getInstance();
  BluetoothServiceRegistry.getInstance();
  CameraServiceRegistry.getInstance();
  LocationServiceRegistry.getInstance();
  NFCServiceRegistry.getInstance();
  SensorServiceRegistry.getInstance();
  QuizServiceRegistry.getInstance();
  imageServiceRegistry.createService('mock'); // 如需其他类型可调整

  // 自动检测补全服务
  MockDataServiceRegistry.getInstance('memory');
  ConfigRegistry.getInstance();
  createEmailService();

  // 自动注入 mock 多语言内容（开发/测试环境专用，生产可移除）
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { insertMockTranslations } = await import('../../../scripts/mock/translations-mock-data');
      await insertMockTranslations();
      // 可加日志
      console.log('[i18n] Mock translations initialized');
    } catch (e) {
      console.warn('[i18n] Mock translations initialization failed:', e);
    }
  }
  // ...如有更多服务，按需补充
}
