// core/services/registry/service-registry.ts
// 全局服务注册表，提供统一的服务获取接口
import { EventEmitter } from 'events';
import type { IAuthService } from '@/core/services/infrastructure/auth/types';
import type { IClientService } from '@/core/services/infrastructure/client/types';
import type { IDataService } from '@/core/services/data/types';
import type { ILocationService } from '@/core/services/infrastructure/phone/location/types';
import type { ISensorService } from '@/core/services/infrastructure/phone/sensor/types';
import type { IBluetoothService } from '@/core/services/infrastructure/phone/bluetooth/types';
import type { ICameraService } from '@/core/services/infrastructure/phone/camera/types';
import type { INFCService } from '@/core/services/infrastructure/phone/nfc/types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { getLoggerService } from '@/core/services/infrastructure/logger';

// 服务初始化状态
export enum ServiceStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  FAILED = 'failed'
}

// 服务类型枚举
export enum ServiceType {
  AUTH = 'auth',
  CLIENT = 'client',
  DATA = 'data',
  CONFIG = 'config',
  LOGGER = 'logger',
  LOCATION = 'location',
  SENSOR = 'sensor',
  BLUETOOTH = 'bluetooth',
  CAMERA = 'camera',
  NFC = 'nfc',
  NOTIFICATION = 'notification',
  PAYMENT = 'payment',
  MESSAGE = 'message',
  QUIZ = 'quiz',
  MATCH = 'match',
  ONBOARD = 'onboard',
  USER = 'user',
  SETTING = 'setting',
  EMAIL = 'email',
  ERROR = 'error',
  NETWORK = 'network',
  IMAGE = 'image',
  TRANSLATION = 'translation'
}

// 服务初始化事件
export enum ServiceEvent {
  INITIALIZED = 'service_initialized',
  FAILED = 'service_failed',
  ALL_INITIALIZED = 'all_services_initialized',
  STATUS_CHANGED = 'service_status_changed'
}

// 服务状态信息
interface ServiceInfo {
  type: ServiceType;
  status: ServiceStatus;
  instance: any;
  error?: Error;
  dependencies?: ServiceType[];
}

/**
 * 全局服务注册表
 * 单例模式，管理所有服务实例的注册和获取
 */
export class ServiceRegistry extends EventEmitter {
  private static instance: ServiceRegistry;
  private services: Map<ServiceType, ServiceInfo> = new Map();
  private logger = getLoggerService();
  private initialized = false;

  private constructor() {
    super();
    // 初始化所有服务状态为未初始化
    Object.values(ServiceType).forEach(type => {
      this.services.set(type as ServiceType, {
        type: type as ServiceType,
        status: ServiceStatus.NOT_INITIALIZED,
        instance: null
      });
    });
  }

  /**
   * 获取服务注册表实例
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 注册服务实例
   * @param type 服务类型
   * @param instance 服务实例
   * @param dependencies 依赖的其他服务类型
   */
  public registerService(type: ServiceType, instance: any, dependencies?: ServiceType[]): void {
    if (!instance) {
      this.logger?.warn(`[ServiceRegistry] 尝试注册空的服务实例: ${type}`);
      return;
    }

    const prevStatus = this.getServiceStatus(type);
    
    this.services.set(type, {
      type,
      status: ServiceStatus.INITIALIZED,
      instance,
      dependencies
    });

    this.logger?.info(`[ServiceRegistry] 服务已注册: ${type}`);
    
    // 触发服务初始化事件
    this.emit(ServiceEvent.INITIALIZED, { type, instance });
    this.emit(ServiceEvent.STATUS_CHANGED, { type, status: ServiceStatus.INITIALIZED, prevStatus });
    
    // 检查是否所有服务都已初始化
    this.checkAllInitialized();
  }

  /**
   * 设置服务状态
   * @param type 服务类型
   * @param status 服务状态
   * @param error 错误信息（如果有）
   */
  public setServiceStatus(type: ServiceType, status: ServiceStatus, error?: Error): void {
    const serviceInfo = this.services.get(type);
    if (!serviceInfo) return;

    const prevStatus = serviceInfo.status;
    
    this.services.set(type, {
      ...serviceInfo,
      status,
      error
    });

    this.logger?.info(`[ServiceRegistry] 服务状态已更新: ${type} => ${status}`);
    
    // 触发状态变更事件
    this.emit(ServiceEvent.STATUS_CHANGED, { type, status, prevStatus, error });
    
    // 如果服务初始化失败，触发失败事件
    if (status === ServiceStatus.FAILED) {
      this.emit(ServiceEvent.FAILED, { type, error });
    }
  }

  /**
   * 获取服务实例
   * @param type 服务类型
   * @returns 服务实例或undefined
   */
  public getService<T = any>(type: ServiceType): T | undefined {
    const serviceInfo = this.services.get(type);
    return serviceInfo?.instance as T | undefined;
  }

  /**
   * 获取服务状态
   * @param type 服务类型
   * @returns 服务状态
   */
  public getServiceStatus(type: ServiceType): ServiceStatus {
    return this.services.get(type)?.status || ServiceStatus.NOT_INITIALIZED;
  }

  /**
   * 获取所有服务状态
   * @returns 服务状态映射
   */
  public getAllServiceStatus(): Map<ServiceType, ServiceStatus> {
    const statusMap = new Map<ServiceType, ServiceStatus>();
    this.services.forEach((info, type) => {
      statusMap.set(type, info.status);
    });
    return statusMap;
  }

  /**
   * 检查是否所有服务都已初始化
   * @returns 是否所有服务都已初始化
   */
  private checkAllInitialized(): boolean {
    let allInitialized = true;
    const requiredServices = [
      ServiceType.AUTH,
      ServiceType.CLIENT,
      ServiceType.DATA,
      ServiceType.CONFIG,
      ServiceType.LOGGER
    ];

    for (const type of requiredServices) {
      const status = this.getServiceStatus(type);
      if (status !== ServiceStatus.INITIALIZED) {
        allInitialized = false;
        break;
      }
    }

    if (allInitialized && !this.initialized) {
      this.initialized = true;
      this.logger?.info('[ServiceRegistry] 所有核心服务已初始化完成');
      this.emit(ServiceEvent.ALL_INITIALIZED);
    }

    return allInitialized;
  }

  /**
   * 重置服务注册表（主要用于测试）
   */
  public reset(): void {
    this.services.clear();
    Object.values(ServiceType).forEach(type => {
      this.services.set(type as ServiceType, {
        type: type as ServiceType,
        status: ServiceStatus.NOT_INITIALIZED,
        instance: null
      });
    });
    this.initialized = false;
    this.removeAllListeners();
  }

  // 类型化的服务获取方法
  public getAuthService(): IAuthService | undefined {
    return this.getService<IAuthService>(ServiceType.AUTH);
  }

  public getClientService(): IClientService | undefined {
    return this.getService<IClientService>(ServiceType.CLIENT);
  }

  public getDataService(): IDataService<BaseEntity> | undefined {
    return this.getService<IDataService<BaseEntity>>(ServiceType.DATA);
  }

  public getLocationService(): ILocationService | undefined {
    return this.getService<ILocationService>(ServiceType.LOCATION);
  }

  public getSensorService(): ISensorService | undefined {
    return this.getService<ISensorService>(ServiceType.SENSOR);
  }

  public getBluetoothService(): IBluetoothService | undefined {
    return this.getService<IBluetoothService>(ServiceType.BLUETOOTH);
  }

  public getCameraService(): ICameraService | undefined {
    return this.getService<ICameraService>(ServiceType.CAMERA);
  }

  public getNFCService(): INFCService | undefined {
    return this.getService<INFCService>(ServiceType.NFC);
  }
}

// 导出单例实例获取方法
export function getServiceRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}