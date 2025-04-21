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
import { getDefaultService as getDefaultImageService } from './business/image/registry/image-service-registry';
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
  // 业务服务
  UserServiceRegistry.getInstance();
  AuthServiceRegistry.getInstance();
  MatchServiceRegistry.getInstance();
  MessageServiceRegistry.getInstance();
  NotificationServiceRegistry.getInstance();
  PaymentServiceRegistry.getInstance();
  BluetoothServiceRegistry.getInstance();
  CameraServiceRegistry.getInstance();
  LocationServiceRegistry.getInstance();
  NFCServiceRegistry.getInstance();
  SensorServiceRegistry.getInstance();
  QuizServiceRegistry.getInstance();
  getDefaultImageService();
  DataServiceRegistry.get('default');
  // 自动检测补全服务
  MockDataServiceRegistry.getInstance('memory');
  ConfigRegistry.getInstance();
  createEmailService();

  // 自动注入 mock 多语言内容（开发/测试环境专用，生产可移除）
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { insertMockTranslations } = await import('@/scripts/mock/translations-mock-data');
      await insertMockTranslations();
      // 可加日志
      console.log('[i18n] Mock translations initialized');
    } catch (e) {
      console.warn('[i18n] Mock translations initialization failed:', e);
    }
  }
  // ...如有更多服务，按需补充
}
