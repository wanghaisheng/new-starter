// core/services/init.ts
// 全局服务初始化入口，保证只初始化一次
import { setLoggerService, createDefaultLogger, createLoggerFromConfig } from './infrastructure/logger/registry/logger-registry';
import { DataServiceRegistry } from './data/registry/data-service-registry';
import { UserServiceRegistry } from './business/user/registry/user-service-registry';
import { AuthServiceRegistry } from './infrastructure/auth/registry/auth-service-registry';
import { MatchServiceRegistry } from './business/deprecated/match/registry/match-service-registry';
import { MessageServiceRegistry } from './business/deprecated/messages/registry/message-service-registry';
import { NotificationServiceRegistry } from './infrastructure/notifications/registry/notification-service-registry';
import { PaymentServiceRegistry } from './infrastructure/payment/registry/payment-service-registry';
import { BluetoothServiceRegistry } from './infrastructure/phone/bluetooth/registry/bluetooth-service-registry';
import { CameraServiceRegistry } from './infrastructure/phone/camera/registry/camera-service-registry';
import { LocationServiceRegistry } from './infrastructure/phone/location/registry/location-service-registry';
import { NFCServiceRegistry } from './infrastructure/phone/nfc/registry/nfc-service-registry';
import { SensorServiceRegistry } from './infrastructure/phone/sensor/registry/sensor-service-registry';
import { QuizServiceRegistry } from './business/deprecated/quiz/registry/quiz-service-registry';
import { imageServiceRegistry } from './infrastructure/image/registry/image-service-registry';
import { getEmailService } from './infrastructure/email/registry/email-registry';
import { registerCoreSchemas } from '@/core/lib/db/schema/core-schemas';
import { createConfigService, ConfigProviderType } from './infrastructure/config/registry/config-registry';
// network
import { NetworkRegistry } from './infrastructure/network/registry/network-registry';
import { getErrorService } from './infrastructure/error/registry/error-registry';

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'test') {
  registerCoreSchemas();
}

let initialized = false;

/**
 * initializeCoreServices
 * App 启动时调用，集中初始化所有核心服务（只执行一次，幂等）
 */
export async function initializeCoreServices() {
  if (initialized) return;
  initialized = true;

  // 1. 日志服务
  let logger = createDefaultLogger();
  setLoggerService(logger);
  logger.info('[init] 启动核心服务初始化...');

  // 2. 配置服务
  let configService;
  try {
    configService = createConfigService(ConfigProviderType.DEFAULT); // 使用枚举类型
    if (typeof configService.initialize === 'function') {
      await configService.initialize();
      logger.info('[init] 配置服务初始化完成');
    }
  } catch (e) {
    logger.error('[init] 配置服务初始化失败', e);
  }

  // 3. 重载日志服务
  try {
    const loggerConfig = configService?.get?.('logger') || {};
    const newLogger = createLoggerFromConfig(loggerConfig);
    if (newLogger) {
      setLoggerService(newLogger);
      logger = newLogger;
      logger.info('[init] 日志服务已根据配置重载');
    }
  } catch (e) {
    logger.error('[init] 日志服务重载失败', e);
  }

  // 4. 其它基础设施服务
  try { getErrorService(); } catch (e) { logger.warn('[init] getErrorService 失败', e); }
  try { NetworkRegistry.getAdapter('default'); } catch (e) { logger.warn('[init] NetworkRegistry 失败', e); }

  // 5. 数据服务
  let dataService;
  try {
    dataService = DataServiceRegistry.get('default');
    await dataService?.initialize?.();
    logger.info('[init] DataService 初始化完成');
  } catch (e) {
    logger.error('[init] DataService 初始化失败', e);
  }

  // 6. 业务服务
  try { UserServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] UserServiceRegistry 失败', e); }
  try { AuthServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] AuthServiceRegistry 失败', e); }
  try { MessageServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] MessageServiceRegistry 失败', e); }
  try { NotificationServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] NotificationServiceRegistry 失败', e); }
  try { PaymentServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] PaymentServiceRegistry 失败', e); }
  try { BluetoothServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] BluetoothServiceRegistry 失败', e); }
  try { CameraServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] CameraServiceRegistry 失败', e); }
  try { LocationServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] LocationServiceRegistry 失败', e); }
  try { NFCServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] NFCServiceRegistry 失败', e); }
  try { SensorServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] SensorServiceRegistry 失败', e); }
  try { QuizServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] QuizServiceRegistry 失败', e); }
  try { imageServiceRegistry.createService('mock'); } catch (e) { logger.warn('[init] imageServiceRegistry 失败', e); }

  if (!dataService) {
    throw new Error('[init] dataService 未初始化，MatchServiceRegistry 依赖 dataService！');
  }

  // 7. MatchService 依赖配置和数据服务
  try {
    const matchServiceOptions = configService?.get?.('matchServiceOptions');
    MatchServiceRegistry.getInstance().createService(
      'remote',
      'default',
      dataService,
      matchServiceOptions
    );
  } catch (e) {
    logger.error('[init] MatchServiceRegistry 初始化失败', e);
  }

  logger.info('[init] 核心服务全部初始化完成');
}
