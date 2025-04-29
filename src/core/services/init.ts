// core/services/init.ts
// 全局服务初始化入口，保证只初始化一次
import { setLoggerService, createDefaultLogger, createLoggerFromConfig } from './infrastructure/logger/registry/logger-registry';
import { parseEnum } from './infrastructure/config/parse-enum';
import { DataServiceRegistry } from './data/registry/data-service-registry';
import { AuthServiceRegistry } from './infrastructure/auth/registry/auth-service-registry';
import { NotificationServiceRegistry } from './infrastructure/notifications/registry/notification-service-registry';
import { PaymentServiceRegistry } from './infrastructure/payment/registry/payment-service-registry';
import { BluetoothServiceRegistry } from './infrastructure/phone/bluetooth/registry/bluetooth-service-registry';
import { CameraServiceRegistry } from './infrastructure/phone/camera/registry/camera-service-registry';
import { LocationServiceRegistry } from './infrastructure/phone/location/registry/location-service-registry';
import { NFCServiceRegistry } from './infrastructure/phone/nfc/registry/nfc-service-registry';
import { SensorServiceRegistry } from './infrastructure/phone/sensor/registry/sensor-service-registry';
import { imageServiceRegistry } from './infrastructure/image/registry/image-service-registry';
import { getEmailService } from './infrastructure/email/registry/email-registry';
import { registerCoreSchemas } from '@/core/lib/db/schema/core-schemas';
import { createConfigService, ConfigProviderType } from './infrastructure/config/registry/config-registry';
import { NetworkRegistry } from './infrastructure/network/registry/network-registry';
import { getErrorService } from './infrastructure/error/registry/error-registry';
import { DataInitializerRegistry } from '@/core/services/infrastructure/data-initializer/registry/data-initializer-registry';
import { DataInitializerService } from './infrastructure/data-initializer/data-initializer-service';
import { DbInitMode } from '@/core/lib/db/types/common';
import { getConfigService } from '@/core/services/infrastructure/config';

if (typeof process !== 'undefined' && process.env && getConfigService().get('NODE_ENV') !== 'test') {
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

  // 0. 注册所有适配器（如认证服务）
  if (typeof AuthServiceRegistry.registerAllAdapters === 'function') {
    AuthServiceRegistry.registerAllAdapters();
  }

  // 注册所有数据初始化适配器，确保全局可用
  DataInitializerRegistry.registerAllAdapters();

  // 1. 日志服务
  let logger = createDefaultLogger();
  setLoggerService(logger);
  logger.info('[init] 启动核心服务初始化...');

  // 2. 配置服务
  let configService;
  try {
    configService = createConfigService(ConfigProviderType.MOCK);
    if (typeof configService.initialize === 'function') {
      await configService.initialize();
      logger.info('[init] MOCK 配置服务初始化完成');
    }
    const detectedProvider = getConfigService().get('NEXT_PUBLIC_CONFIG_PROVIDER') || getConfigService().get('CONFIG_ADAPTER');
    if (detectedProvider && detectedProvider !== ConfigProviderType.MOCK) {
      const realProvider = parseEnum(ConfigProviderType, detectedProvider, ConfigProviderType.DEFAULT, 'initConfig');
      const realService = createConfigService(realProvider);
      if (typeof realService.initialize === 'function') {
        await realService.initialize();
        logger.info(`[init] ${realProvider} 配置服务初始化完成`);
      }
      configService = realService;
    }
  } catch (err) {
    logger.error('[init] 配置服务初始化失败', err);
    throw err;
  }

  // 3. 数据库初始化（结构+默认数据，幂等）
  try {
    const dbInitService = new DataInitializerService({
      mode: getConfigService().get('NEXT_PUBLIC_DB_INIT_MODE') || DbInitMode.SCHEMA,
      config: { dbClient: undefined }, // TODO: 传递实际 dbClient
    });
    await dbInitService.initialize({ mode: 'full', reset: true });
    logger.info('[init] 数据库结构及默认数据初始化完成');
  } catch (err) {
    logger.error('[init] 数据库初始化失败', err);
    throw err;
  }

  // 3. 重载日志服务
  try {
    const loggerConfig = configService?.get?.('logger') || {};
    const newLogger = createLoggerFromConfig(loggerConfig);
    if (newLogger) {
      logger = newLogger;
      setLoggerService(newLogger);
      logger.info('[init] 日志服务已根据配置重载');
    }
  } catch (e) {
    logger.error('[init] 日志服务重载失败', e);
  }

  // 4. 基础设施服务
  try { getErrorService(); } catch (e) { logger.warn('[init] getErrorService 失败', e); }
  try { NetworkRegistry.getAdapter('default'); } catch (e) { logger.warn('[init] NetworkRegistry 失败', e); }

  // 5. 数据服务（支持多实现，自动切换）
  let dataService;
  try {
    dataService = DataServiceRegistry.get('default');
    await dataService?.initialize?.();
    logger.info('[init] DataService 初始化完成');
  } catch (e) {
    logger.error('[init] DataService 初始化失败', e);
  }

  // 6. 业务服务（只初始化实际存在的服务）
  try { AuthServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] AuthServiceRegistry 失败', e); }
  try { NotificationServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] NotificationServiceRegistry 失败', e); }
  try { PaymentServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] PaymentServiceRegistry 失败', e); }
  try { BluetoothServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] BluetoothServiceRegistry 失败', e); }
  try { CameraServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] CameraServiceRegistry 失败', e); }
  try { LocationServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] LocationServiceRegistry 失败', e); }
  try { NFCServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] NFCServiceRegistry 失败', e); }
  try { SensorServiceRegistry.getInstance(); } catch (e) { logger.warn('[init] SensorServiceRegistry 失败', e); }
  try { imageServiceRegistry.createService('mock'); } catch (e) { logger.warn('[init] imageServiceRegistry 失败', e); }

  // 7. 其它可选服务按需添加（如 getEmailService）
  try { getEmailService(); } catch (e) { logger.warn('[init] getEmailService 失败', e); }

  logger.info('[init] 核心服务全部初始化完成');
}
