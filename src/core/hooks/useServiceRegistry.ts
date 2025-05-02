// core/hooks/useServiceRegistry.ts
// 提供统一的服务获取钩子，基于服务注册表
import { useEffect, useState } from 'react';
import { getServiceRegistry, ServiceType, ServiceStatus, ServiceEvent } from '@/core/services/registry/service-registry';

/**
 * 使用服务注册表钩子
 * 提供对全局服务注册表的访问，以及服务状态监听
 */
export function useServiceRegistry() {
  const serviceRegistry = getServiceRegistry();
  const [servicesReady, setServicesReady] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<Map<ServiceType, ServiceStatus>>(
    serviceRegistry.getAllServiceStatus()
  );

  // 监听服务状态变化
  useEffect(() => {
    const handleStatusChange = () => {
      setServiceStatuses(serviceRegistry.getAllServiceStatus());
    };

    const handleAllInitialized = () => {
      setServicesReady(true);
    };

    // 订阅服务状态变更事件
    serviceRegistry.on(ServiceEvent.STATUS_CHANGED, handleStatusChange);
    serviceRegistry.on(ServiceEvent.ALL_INITIALIZED, handleAllInitialized);

    // 初始检查是否所有服务已就绪
    const requiredServices = [
      ServiceType.AUTH,
      ServiceType.CLIENT,
      ServiceType.DATA,
      ServiceType.CONFIG,
      ServiceType.LOGGER
    ];

    let allReady = true;
    for (const type of requiredServices) {
      if (serviceRegistry.getServiceStatus(type) !== ServiceStatus.INITIALIZED) {
        allReady = false;
        break;
      }
    }
    setServicesReady(allReady);

    return () => {
      // 取消订阅
      serviceRegistry.off(ServiceEvent.STATUS_CHANGED, handleStatusChange);
      serviceRegistry.off(ServiceEvent.ALL_INITIALIZED, handleAllInitialized);
    };
  }, []);

  return {
    serviceRegistry,
    servicesReady,
    serviceStatuses,
    // 类型化的服务获取方法
    getService: serviceRegistry.getService.bind(serviceRegistry),
    getAuthService: serviceRegistry.getAuthService.bind(serviceRegistry),
    getClientService: serviceRegistry.getClientService.bind(serviceRegistry),
    getDataService: serviceRegistry.getDataService.bind(serviceRegistry),
    getLocationService: serviceRegistry.getLocationService.bind(serviceRegistry),
    getSensorService: serviceRegistry.getSensorService.bind(serviceRegistry),
    getBluetoothService: serviceRegistry.getBluetoothService.bind(serviceRegistry),
    getCameraService: serviceRegistry.getCameraService.bind(serviceRegistry),
    getNFCService: serviceRegistry.getNFCService.bind(serviceRegistry),
  };
}