import { MockNotificationServiceAdapter } from '../adapters/mock-notification-service-adapter';
import { RemoteNotificationServiceAdapter } from '../adapters/remote-notification-service-adapter';
import { HybridNotificationServiceAdapter } from '../adapters/hybrid-notification-service-adapter';
import type { INotificationAdapter, INotificationService } from '../types/notification-service';
import { NotificationService } from '../service/notification-service';

export type NotificationServiceType = 'mock' | 'remote' | 'hybrid';
export type NotificationServiceOptions = {
  apiBaseUrl?: string;
  [key: string]: any;
};

/**
 * Notification Service 工厂，统一对象参数风格
 */
export class NotificationServiceFactory {
  static createService({
    type = 'mock',
    dataService,
    options = {}
  }: {
    type?: NotificationServiceType,
    dataService?: any,
    options?: NotificationServiceOptions
  } = {}): INotificationService {
    // 统一通过 type/options/dataService 创建 NotificationService，内部自动注入 adapter
    return new NotificationService(type, options, dataService);
  }

  // 新增：自动适配器获取（供统一注册表/工厂调用）
  static getAdapter(type: NotificationServiceType = 'mock', options: NotificationServiceOptions = {}): INotificationAdapter {
    switch (type) {
      case 'mock':
        return new MockNotificationServiceAdapter();
      case 'remote':
        return new RemoteNotificationServiceAdapter(options.apiBaseUrl);
      case 'hybrid':
        return new HybridNotificationServiceAdapter(options.apiBaseUrl);
      default:
        throw new Error(`Unknown notification service type: ${type}`);
    }
  }
}
