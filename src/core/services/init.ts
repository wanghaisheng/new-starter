// core/services/init.ts
// 全局服务初始化入口，保证只初始化一次
import { getLoggerService, setLoggerService, createDefaultLogger, createLoggerFromConfig } from './infrastructure/logger/registry/logger-registry';
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
import { getConfigService } from './infrastructure/config/registry/config-registry';
import { createEmailService } from './infrastructure/email';
import { registerCoreSchemas } from '@/core/lib/db/schema/core-schemas';

// 仅主程序环境注册所有核心表结构，测试环境请手动注册需要的 schema
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

  // 1. 先创建默认日志服务，保证后续日志不丢失
  let logger = createDefaultLogger();
  setLoggerService(logger);
  logger.info('[init] 启动核心服务初始化...');

  // 2. 配置服务优先初始化，确保配置变量可用
  const configService = getConfigService();
  try {
    if (typeof configService.initialize === 'function') {
      await configService.initialize();
      logger.info('[init] 配置服务初始化完成');
    }
  } catch (e) {
    logger.error('[init] 配置服务初始化失败', e);
  }

  // 3. 根据配置重载日志服务（如有需要）
  const loggerConfig = configService.get?.('logger') || {};
  const newLogger = createLoggerFromConfig(loggerConfig);
  if (newLogger) {
    setLoggerService(newLogger);
    logger = newLogger;
    logger.info('[init] 日志服务已根据配置重载');
  }

  // 4. 其它基础设施服务
  getErrorService();
  getNetworkManager();

  // 5. 数据服务初始化（内部自动读取配置服务，无需外部传参）
  const dataService = DataServiceRegistry.get('default');
  await dataService?.initialize?.();
  logger.info('[init] DataService 初始化完成');

  // 6. 业务服务（全部通过 Registry 单例获取，禁止 Factory 直连）
  UserServiceRegistry.getInstance();
  AuthServiceRegistry.getInstance();
  if (!dataService) {
    throw new Error('[init] dataService 未初始化，MatchServiceRegistry 依赖 dataService！');
  }
  // 可选：订阅全局配置变更事件
  // configService.subscribe?.('matchServiceOptions', (val) => { ... });

  // 获取配置并初始化业务服务
  const matchServiceOptions = configService.get('matchServiceOptions');
  const matchService = MatchServiceRegistry.getInstance().createService(
    'remote',
    'default',
    dataService,
    matchServiceOptions
  );
  NotificationServiceRegistry.getInstance();
  PaymentServiceRegistry.getInstance();
  BluetoothServiceRegistry.getInstance();
  CameraServiceRegistry.getInstance();
  LocationServiceRegistry.getInstance();
  NFCServiceRegistry.getInstance();
  SensorServiceRegistry.getInstance();
  QuizServiceRegistry.getInstance();
  imageServiceRegistry.createService('mock'); // 如需其他类型可调整

  logger.info('[init] 核心服务全部初始化完成');
}
