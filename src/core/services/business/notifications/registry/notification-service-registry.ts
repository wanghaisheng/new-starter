import type { INotificationService } from '../types/notification-service';
import { NotificationServiceFactory, NotificationServiceType, NotificationServiceOptions } from '../factory/notification-service-factory';

/**
 * 通知服务注册表，支持多实例、mock/remote/hybrid 切换
 * 统一对外服务注册表，并内置适配器注册/获取接口，便于插件式扩展
 */
export class NotificationServiceRegistry {
  private static instance: NotificationServiceRegistry;
  private registry: Record<string, INotificationService> = {};
  // 适配器注册表，兼容插件式动态注册
  private static adapters: Partial<Record<NotificationServiceType, () => INotificationService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new NotificationServiceRegistry();
    return this.instance;
  }

  /**
   * 统一 provider 获取方法（推荐 hooks/页面调用）
   */
  getProvider(type: NotificationServiceType = 'mock', name: string = 'default', dataService?: any, options?: NotificationServiceOptions): () => INotificationService {
    return () => this.createService(type, name, dataService, options);
  }

  /**
   * 统一 createService 签名，兼容 options 扩展
   */
  createService(type: NotificationServiceType = 'mock', name: string = 'default', dataService?: any, options?: NotificationServiceOptions): INotificationService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = NotificationServiceRegistry.adapters[type];
    const service = adapter
      ? adapter()
      : NotificationServiceFactory.createService({ type, dataService, options });
    this.registry[key] = service;
    return service;
  }

  /** 获取已注册实例 */
  getService(type: NotificationServiceType, name: string = 'default'): INotificationService | undefined {
    return this.registry[`${type}:${name}`];
  }

  /**
   * 适配器注册与获取（插件式扩展场景）
   */
  static registerAdapter(type: NotificationServiceType, factory: () => INotificationService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: NotificationServiceType): (() => INotificationService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: NotificationServiceType): void {
    delete this.adapters[type];
  }

  /**
   * 获取默认实例（兼容 hooks 统一调用）
   * 优先 remote，其次 hybrid，其次 mock
   */
  getDefaultService(dataService?: any, options?: NotificationServiceOptions): INotificationService {
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock', 'default', dataService, options)
    );
  }

  /** 清空注册表 */
  clear() {
    this.registry = {};
  }

  /**
   * 批量注册所有内置通知适配器（可在应用入口调用一次）
   */
  static registerAllAdapters() {
    NotificationServiceRegistry.registerAdapter('mock', () => NotificationServiceFactory.createService({ type: 'mock' }));
    NotificationServiceRegistry.registerAdapter('remote', () => NotificationServiceFactory.createService({ type: 'remote' }));
    NotificationServiceRegistry.registerAdapter('hybrid', () => NotificationServiceFactory.createService({ type: 'hybrid' }));
  }
}
