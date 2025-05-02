import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { getLoggerService } from '@/core/services/infrastructure/logger';
import { getServiceRegistry, ServiceType, ServiceStatus, ServiceEvent } from '@/core/services/registry/service-registry';
import { initializeCoreServices } from '@/core/services/init';

import type { IAuthService } from '@/core/services/infrastructure/auth/types';
import type { ILocationService } from '@/core/services/infrastructure/phone/location/types';
import type { ISensorService } from '@/core/services/infrastructure/phone/sensor/types';
import type { IBluetoothService } from '@/core/services/infrastructure/phone/bluetooth/types';
import type { ICameraService } from '@/core/services/infrastructure/phone/camera/types';
import type { INFCService } from '@/core/services/infrastructure/phone/nfc/types';
import type { IClientService } from '@/core/services/infrastructure/client/types';

// 业务服务 context 类型
interface ServiceContextType {
  // 基础服务
  authService: any;
  clientService: any;
  dataService: any;
  configService: any;
  loggerService: any;
  locationService: any;
  sensorService: any;
  bluetoothService: any;
  cameraService: any;
  nfcService: any;
  notificationService: any;
  paymentService: any;
  errorService: any;
  networkService: any;
  imageService: any;
  translationService: any;
  
  // 业务服务
  messageService: any;
  quizService: any;
  matchService: any;
  onboardService: any;
  userService: any;
  settingService: any;
  emailService: any;
  
  // 服务状态
  servicesInitialized: boolean;
  // 可继续扩展其它 service
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const logger = getLoggerService();
  const serviceRegistry = getServiceRegistry();
  const [servicesInitialized, setServicesInitialized] = useState(false);

  // 确保核心服务已初始化
  useEffect(() => {
    const initServices = async () => {
      try {
        await initializeCoreServices();
        logger.info('[ServiceProvider] 核心服务初始化完成');
        setServicesInitialized(true);
      } catch (error) {
        logger.error('[ServiceProvider] 核心服务初始化失败', error);
      }
    };
    
    // 监听所有服务初始化完成事件
    serviceRegistry.on(ServiceEvent.ALL_INITIALIZED, () => {
      logger.info('[ServiceProvider] 所有服务初始化完成');
      setServicesInitialized(true);
    });
    
    initServices();
    
    return () => {
      // 清理事件监听
      serviceRegistry.off(ServiceEvent.ALL_INITIALIZED);
    };
  }, []);

  // 统一从服务注册表获取所有服务实例
  // 基础服务
  const authService = useMemo(() => serviceRegistry.getService(ServiceType.AUTH), []);
  const clientService = useMemo(() => serviceRegistry.getService(ServiceType.CLIENT), []);
  const dataService = useMemo(() => serviceRegistry.getService(ServiceType.DATA), []);
  const configService = useMemo(() => serviceRegistry.getService(ServiceType.CONFIG), []);
  const loggerService = useMemo(() => serviceRegistry.getService(ServiceType.LOGGER), []);
  const locationService = useMemo(() => serviceRegistry.getService(ServiceType.LOCATION), []);
  const sensorService = useMemo(() => serviceRegistry.getService(ServiceType.SENSOR), []);
  const bluetoothService = useMemo(() => serviceRegistry.getService(ServiceType.BLUETOOTH), []);
  const cameraService = useMemo(() => serviceRegistry.getService(ServiceType.CAMERA), []);
  const nfcService = useMemo(() => serviceRegistry.getService(ServiceType.NFC), []);
  const notificationService = useMemo(() => serviceRegistry.getService(ServiceType.NOTIFICATION), []);
  const paymentService = useMemo(() => serviceRegistry.getService(ServiceType.PAYMENT), []);
  const errorService = useMemo(() => serviceRegistry.getService(ServiceType.ERROR), []);
  const networkService = useMemo(() => serviceRegistry.getService(ServiceType.NETWORK), []);
  const imageService = useMemo(() => serviceRegistry.getService(ServiceType.IMAGE), []);
  const translationService = useMemo(() => serviceRegistry.getService(ServiceType.TRANSLATION), []);
  
  // 业务服务实例
  const messageService = useMemo(() => serviceRegistry.getService(ServiceType.MESSAGE), []);
  const quizService = useMemo(() => serviceRegistry.getService(ServiceType.QUIZ), []);
  const matchService = useMemo(() => serviceRegistry.getService(ServiceType.MATCH), []);
  const onboardService = useMemo(() => serviceRegistry.getService(ServiceType.ONBOARD), []);
  const userService = useMemo(() => serviceRegistry.getService(ServiceType.USER), []);
  const settingService = useMemo(() => serviceRegistry.getService(ServiceType.SETTING), []);
  const emailService = useMemo(() => serviceRegistry.getService(ServiceType.EMAIL), []);

  // 验证所有必需服务是否已初始化
  useEffect(() => {
    const validateServices = () => {
      const requiredServiceTypes = [
        ServiceType.AUTH,
        ServiceType.CLIENT,
        ServiceType.DATA,
        ServiceType.CONFIG,
        ServiceType.LOGGER,
        ServiceType.LOCATION,
        ServiceType.SENSOR,
        ServiceType.BLUETOOTH,
        ServiceType.CAMERA,
        ServiceType.NFC
      ];

      const missingServices = requiredServiceTypes
        .filter(type => !serviceRegistry.getService(type))
        .map(type => type);

      if (missingServices.length > 0) {
        logger.error('[ServiceProvider] 缺少必要的服务实例:', missingServices);
        throw new Error(`缺少必要的服务实例: ${missingServices.join(', ')}`);
      }
    };

    if (servicesInitialized) {
      validateServices();
    }
  }, [serviceRegistry, servicesInitialized]);

  return (
    <ServiceContext.Provider value={{
      // 基础服务
      authService,
      clientService,
      dataService,
      configService,
      loggerService,
      locationService,
      sensorService,
      bluetoothService,
      cameraService,
      nfcService,
      notificationService,
      paymentService,
      errorService,
      networkService,
      imageService,
      translationService,
      
      // 业务服务
      messageService,
      quizService,
      matchService,
      onboardService,
      userService,
      settingService,
      emailService,
      
      // 服务状态
      servicesInitialized
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useService 必须在 ServiceProvider 内使用');
  return ctx;
}

// 统一的服务钩子命名格式
export function useAuthService() {
  const { authService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return authService;
}

export function useClientService() {
  const { clientService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return clientService;
}

export function useDataService() {
  const { dataService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return dataService;
}

export function useConfigService() {
  const { configService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return configService;
}

export function useLoggerService() {
  const { loggerService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return loggerService;
}

export function useLocationService() {
  const { locationService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return locationService;
}

export function useSensorService() {
  const { sensorService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return sensorService;
}

export function useBluetoothService() {
  const { bluetoothService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return bluetoothService;
}

export function useCameraService() {
  const { cameraService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return cameraService;
}

export function useNFCService() {
  const { nfcService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return nfcService;
}

export function useNotificationService() {
  const { notificationService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return notificationService;
}

export function usePaymentService() {
  const { paymentService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return paymentService;
}

export function useErrorService() {
  const { errorService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return errorService;
}

export function useNetworkService() {
  const { networkService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return networkService;
}

export function useImageService() {
  const { imageService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return imageService;
}

export function useTranslationService() {
  const { translationService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return translationService;
}

export function useMessageService() {
  const { messageService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return messageService;
}

export function useQuizService() {
  const { quizService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return quizService;
}

export function useMatchService() {
  const { matchService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return matchService;
}

export function useOnboardService() {
  const { onboardService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return onboardService;
}

export function useUserService() {
  const { userService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return userService;
}

export function useSettingService() {
  const { settingService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return settingService;
}

export function useEmailService() {
  const { emailService, servicesInitialized } = useService();
  if (!servicesInitialized) {
    throw new Error('服务尚未完成初始化，请等待初始化完成后再使用');
  }
  return emailService;
}
