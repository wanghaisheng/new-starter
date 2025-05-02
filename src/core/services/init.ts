// core/services/init.ts
// 全局服务初始化入口，保证只初始化一次
import { initLogger, getLoggerService, resetLogger } from './infrastructure/logger';
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
import { AuthStrategy, AuthProvider, SocialLoginProvider } from '@/core/lib/db/types/common';
import { getServiceRegistry, ServiceRegistry, ServiceType, ServiceStatus, ServiceEvent } from './registry/service-registry';

if (typeof process !== 'undefined' && process.env && getConfigService().get('NODE_ENV') !== 'test') {
  registerCoreSchemas();
}

let initialized = false;

// 初始化状态和事件
const serviceRegistry = getServiceRegistry();

/**
 * initializeCoreServices
 * App 启动时调用，集中初始化所有核心服务（只执行一次，幂等）
 * @returns 返回服务注册表实例，可用于获取所有已初始化的服务
 */
export async function initializeCoreServices() {
  if (initialized) return serviceRegistry;
  initialized = true;

  // 0. 注册所有适配器（如认证服务）
  if (typeof AuthServiceRegistry.registerAllAdapters === 'function') {
    AuthServiceRegistry.registerAllAdapters();
  }

  // 注册所有数据初始化适配器，确保全局可用
  DataInitializerRegistry.registerAllAdapters();
  
  // 注册所有客户端服务适配器
  try {
    const { ClientServiceRegistry } = await import('./infrastructure/client/registry/client-service-registry');
    if (typeof ClientServiceRegistry.registerAllAdapters === 'function') {
      ClientServiceRegistry.registerAllAdapters();
    }
  } catch (e) {
    console.warn('[init] 客户端服务适配器注册失败', e);
  }


  // 1. 配置服务和日志服务初始化
  let configService;
  let logger;
  
  // 更新服务状态
  serviceRegistry.setServiceStatus(ServiceType.CONFIG, ServiceStatus.INITIALIZING);
  serviceRegistry.setServiceStatus(ServiceType.LOGGER, ServiceStatus.INITIALIZING);
  
  try {
    // 使用标准的 initConfig 方法初始化配置服务（遵循最佳实践）
    const { initConfig } = await import('./infrastructure/config');
    const configKeys = await import('./infrastructure/config/config-keys');
    
    // 从环境变量中获取配置提供者类型（如果有）
    const providerType = process.env.NEXT_PUBLIC_CONFIG_PROVIDER || process.env.CONFIG_ADAPTER;
    
    // 调用标准初始化方法，自动选择适配器/来源
    const configResult = await initConfig(
      providerType ? parseEnum(ConfigProviderType, providerType, ConfigProviderType.DEFAULT, 'initConfig') : undefined
    );
    configService = configResult.configService;
    
    // 注册配置服务到服务注册表
    serviceRegistry.registerService(ServiceType.CONFIG, configService);
    
    // 2. 日志服务初始化（从配置服务获取日志provider类型）
    const { loggerService } = await initLogger();
    // 确保日志服务不为undefined，即使initLogger返回undefined也使用getLoggerService获取
    logger = loggerService || getLoggerService();
    
    if (!logger) {
      // 如果仍然无法获取日志服务，创建一个简单的控制台日志对象作为后备
      logger = {
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
        trace: console.trace
      };
      console.warn('[init] 无法获取日志服务，使用控制台日志作为后备');
    }
    
    // 注册日志服务到服务注册表
    serviceRegistry.registerService(ServiceType.LOGGER, logger);
    
    logger.info('[init] 启动核心服务初始化...');
    
    logger.info('[init] 配置服务初始化完成');
    
    // 预加载业务服务配置项
    try {
      // 消息服务配置
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_MESSAGE_TYPE);
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_MESSAGE_FEATURES);
      
      // 测验服务配置
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_QUIZ_TYPE);
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_QUIZ_FEATURES);
      
      // 匹配服务配置
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_MATCH_TYPE);
      
      // 引导服务配置
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_ONBOARD_TYPE);
      configService.get(configKeys.BUSINESS_KEYS.NEXT_PUBLIC_ONBOARD_FEATURES);
      
      logger.info('[init] 业务服务配置预加载完成');
    } catch (e) {
      logger.warn('[init] 业务服务配置预加载部分失败', e);
    }
  } catch (err) {
    // 确保即使在配置服务初始化失败的情况下也能记录日志
    if (logger) {
      logger.error('[init] 配置服务初始化失败', err);
    } else {
      console.error('[init] 配置服务初始化失败', err);
    }
    throw err;
  }

  // 3. 数据库初始化（结构+默认数据，幂等）
  try {
    // 使用标准的 initDataInitializer 方法初始化数据初始化服务（遵循最佳实践）
    const { initDataInitializer } = await import('./infrastructure/data-initializer');
    
    // 从环境变量或配置服务中获取初始化模式
    const initMode = getConfigService().get('NEXT_PUBLIC_DB_INIT_MODE');
    
    // 调用标准初始化方法，自动选择适配器
    const { dataInitializerService, client } = await initDataInitializer(initMode);
    
    // 执行完整初始化（包括结构和数据）
    await dataInitializerService.initialize({ mode: 'full', reset: true });
    
    logger?.info('[init] 数据库结构及默认数据初始化完成');
  } catch (err) {
    if (logger) {
      logger.error('[init] 数据库初始化失败', err);
    } else {
      console.error('[init] 数据库初始化失败', err);
    }
    throw err;
  }

  // 3. 重载日志服务（如果配置中有更详细的日志配置）
  try {
    const loggerConfig = configService?.get?.('logger') || {};
    if (Object.keys(loggerConfig).length > 0) {
      // 重置并重新初始化日志服务
      resetLogger();
      const { loggerService: newLogger } = await initLogger(loggerConfig.provider);
      // 确保新的日志服务不为undefined
      if (newLogger) {
        logger = newLogger;
        logger.info('[init] 日志服务已根据配置重载');
      } else if (logger) {
        logger.warn('[init] 日志服务重载后返回undefined，继续使用原日志服务');
      } else {
        console.warn('[init] 日志服务重载后返回undefined，且原日志服务不可用');
      }
    }
  } catch (e) {
    if (logger) {
      logger.error('[init] 日志服务重载失败', e);
    } else {
      console.error('[init] 日志服务重载失败', e);
    }
  }

  // 4. 基础设施服务
  try { getErrorService(); } catch (e) { logger.warn('[init] getErrorService 失败', e); }
  try { NetworkRegistry.getAdapter('default'); } catch (e) { logger.warn('[init] NetworkRegistry 失败', e); }
  
  // 4.1 客户端服务初始化
  serviceRegistry.setServiceStatus(ServiceType.CLIENT, ServiceStatus.INITIALIZING);
  try {
    // 使用标准的 initClientService 方法初始化客户端服务（遵循最佳实践）
    const { initClientService, getClientService } = await import('./infrastructure/client');
    
    // 从环境变量或配置服务中获取客户端服务类型
    const providerType = configService.get('NEXT_PUBLIC_CLIENT_PROVIDER') || configService.get('CLIENT_ADAPTER');
    
    // 调用标准初始化方法，自动选择适配器/来源
    const { clientService } = await initClientService(providerType);
    
    // 注册客户端服务到服务注册表
    serviceRegistry.registerService(ServiceType.CLIENT, clientService);
    
    logger.info('[init] ClientService 初始化完成');
  } catch (e) {
    logger.error('[init] ClientService 初始化失败', e);
    serviceRegistry.setServiceStatus(ServiceType.CLIENT, ServiceStatus.FAILED, e as Error);
  }

  // 5. 数据服务（支持多实现，自动切换）
  serviceRegistry.setServiceStatus(ServiceType.DATA, ServiceStatus.INITIALIZING);
  let dataService;
  try {
    // 使用标准的 initDataService 方法初始化数据服务（遵循最佳实践）
    const { initDataService, getDataService } = await import('./data');
    
    // 从环境变量或配置服务中获取数据服务类型
    const serviceType = configService.get('NEXT_PUBLIC_DATA_SERVICE_TYPE') || configService.get('DATA_SERVICE_TYPE');
    
    // 调用标准初始化方法，自动选择适配器/来源
    const { dataService: ds } = await initDataService(serviceType);
    dataService = ds;
    
    // 注册数据服务到服务注册表
    serviceRegistry.registerService(ServiceType.DATA, dataService);
    
    logger.info('[init] DataService 初始化完成');
  } catch (e) {
    logger.error('[init] DataService 初始化失败', e);
    serviceRegistry.setServiceStatus(ServiceType.DATA, ServiceStatus.FAILED, e as Error);
  }

  // 6. 认证服务初始化
  serviceRegistry.setServiceStatus(ServiceType.AUTH, ServiceStatus.INITIALIZING);
  try {
    // 使用标准的 initAuth 方法初始化认证服务（遵循最佳实践）
    const { initAuth, getAuthService } = await import('./infrastructure/auth');
    
    // 从环境变量或配置服务中获取认证配置
    const configService = getConfigService();
    const authConfig = {
      strategy: configService.get('NEXT_PUBLIC_AUTH_STRATEGY') as AuthStrategy || AuthStrategy.Mock,
      provider: configService.get('NEXT_PUBLIC_AUTH_PROVIDER') as AuthProvider || AuthProvider.Mock,
      options: {
        session: {
          duration: configService.get('NEXT_PUBLIC_SESSION_DURATION') || '1d',
          refresh: configService.get('NEXT_PUBLIC_SESSION_REFRESH') || '30m',
          cookie: {
            name: configService.get('NEXT_PUBLIC_SESSION_COOKIE_NAME') || 'auth_session',
            domain: configService.get('NEXT_PUBLIC_SESSION_COOKIE_DOMAIN') || '',
            secure: configService.get('NEXT_PUBLIC_SESSION_COOKIE_SECURE') || false
          }
        },
        token: {
          expiry: configService.get('NEXT_PUBLIC_TOKEN_EXPIRY') || '7d',
          refresh: configService.get('NEXT_PUBLIC_TOKEN_REFRESH') || '1d',
          algorithm: configService.get('NEXT_PUBLIC_TOKEN_ALGORITHM') || 'HS256',
          secret: configService.get('NEXT_PUBLIC_TOKEN_SECRET') || 'your-secret-key-here'
        },
        security: {
          rateLimit: configService.get('NEXT_PUBLIC_AUTH_RATE_LIMIT') || '100/hour',
          loginAttempts: configService.get('NEXT_PUBLIC_LOGIN_ATTEMPTS') || 5,
          lockoutDuration: configService.get('NEXT_PUBLIC_LOCKOUT_DURATION') || '15m',
          password: {
            minLength: configService.get('NEXT_PUBLIC_PASSWORD_MIN_LENGTH') || 8,
            maxLength: configService.get('NEXT_PUBLIC_PASSWORD_MAX_LENGTH') || 128,
            requireUppercase: configService.get('NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE') || true,
            requireLowercase: configService.get('NEXT_PUBLIC_PASSWORD_REQUIRE_LOWERCASE') || true,
            requireNumber: configService.get('NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBER') || true,
            requireSpecial: configService.get('NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL') || true
          }
        },
        socialLogin: {
          providers: (configService.get('NEXT_PUBLIC_SOCIAL_LOGIN_PROVIDERS') as string | undefined || '').split(','),
          google: {
            clientId: configService.get('NEXT_PUBLIC_GOOGLE_CLIENT_ID') || '',
            clientSecret: configService.get('NEXT_PUBLIC_GOOGLE_CLIENT_SECRET') || ''
          },
          facebook: {
            appId: configService.get('NEXT_PUBLIC_FACEBOOK_APP_ID') || '',
            appSecret: configService.get('NEXT_PUBLIC_FACEBOOK_APP_SECRET') || ''
          },
          apple: {
            teamId: configService.get('NEXT_PUBLIC_APPLE_TEAM_ID') || '',
            keyId: configService.get('NEXT_PUBLIC_APPLE_KEY_ID') || '',
            privateKey: configService.get('NEXT_PUBLIC_APPLE_PRIVATE_KEY') || ''
          }
        }
      }
    };

    // 调用标准初始化方法，自动选择适配器
    const authService = await initAuth(authConfig);
    
    // 注册认证服务到服务注册表
    serviceRegistry.registerService(ServiceType.AUTH, authService);
    
    logger.info('[init] AuthService 初始化完成');
  } catch (e) {
    logger.error('[init] AuthService 初始化失败', e);
    serviceRegistry.setServiceStatus(ServiceType.AUTH, ServiceStatus.FAILED, e as Error);
  }

  // 6.1 基础业务服务（只初始化实际存在的服务）
  try { 
    const notificationService = NotificationServiceRegistry.getInstance(); 
    serviceRegistry.registerService(ServiceType.NOTIFICATION, notificationService);
  } catch (e) { 
    logger.warn('[init] NotificationServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.NOTIFICATION, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const paymentService = PaymentServiceRegistry.getInstance(); 
    serviceRegistry.registerService(ServiceType.PAYMENT, paymentService);
  } catch (e) { 
    logger.warn('[init] PaymentServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.PAYMENT, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const bluetoothService = BluetoothServiceRegistry.getInstance().getDefaultService(); 
    serviceRegistry.registerService(ServiceType.BLUETOOTH, bluetoothService);
  } catch (e) { 
    logger.warn('[init] BluetoothServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.BLUETOOTH, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const cameraService = CameraServiceRegistry.getInstance().getDefaultService(); 
    serviceRegistry.registerService(ServiceType.CAMERA, cameraService);
  } catch (e) { 
    logger.warn('[init] CameraServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.CAMERA, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const locationService = LocationServiceRegistry.getInstance().getDefaultService(); 
    serviceRegistry.registerService(ServiceType.LOCATION, locationService);
  } catch (e) { 
    logger.warn('[init] LocationServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.LOCATION, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const nfcService = NFCServiceRegistry.getInstance().getDefaultService(); 
    serviceRegistry.registerService(ServiceType.NFC, nfcService);
  } catch (e) { 
    logger.warn('[init] NFCServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.NFC, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const sensorService = SensorServiceRegistry.getInstance().getDefaultService(); 
    serviceRegistry.registerService(ServiceType.SENSOR, sensorService);
  } catch (e) { 
    logger.warn('[init] SensorServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.SENSOR, ServiceStatus.FAILED, e as Error);
  }
  
  try { 
    const imageService = imageServiceRegistry.createService('mock'); 
    serviceRegistry.registerService(ServiceType.IMAGE, imageService);
  } catch (e) { 
    logger.warn('[init] imageServiceRegistry 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.IMAGE, ServiceStatus.FAILED, e as Error);
  }
  
  // 6.2 初始化业务服务（消息、测验、匹配、引导等）
  try {
    // 动态导入业务服务初始化模块
    const businessServiceInit = await import('./business/business-service-init');
    
    // 注册业务服务到服务注册表
    if (businessServiceInit.messageService) {
      serviceRegistry.registerService(ServiceType.MESSAGE, businessServiceInit.messageService);
    }
    
    if (businessServiceInit.quizService) {
      serviceRegistry.registerService(ServiceType.QUIZ, businessServiceInit.quizService);
    }
    
    if (businessServiceInit.matchService) {
      serviceRegistry.registerService(ServiceType.MATCH, businessServiceInit.matchService);
    }
    
    if (businessServiceInit.onboardService) {
      serviceRegistry.registerService(ServiceType.ONBOARD, businessServiceInit.onboardService);
    }
    
    if (businessServiceInit.userService) {
      serviceRegistry.registerService(ServiceType.USER, businessServiceInit.userService);
    }
    
    logger.info('[init] 业务服务初始化完成');
  } catch (e) {
    logger.warn('[init] 业务服务初始化失败', e);
  }

  // 7. 其它可选服务按需添加（如 getEmailService）
  try { 
    const emailService = getEmailService(); 
    serviceRegistry.registerService(ServiceType.EMAIL, emailService);
  } catch (e) { 
    logger.warn('[init] getEmailService 失败', e); 
    serviceRegistry.setServiceStatus(ServiceType.EMAIL, ServiceStatus.FAILED, e as Error);
  }

  logger.info('[init] 核心服务全部初始化完成');
  
  // 返回服务注册表实例，方便外部获取服务
  return serviceRegistry;
}
