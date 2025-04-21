import { MockNotificationServiceAdapter } from '../adapters/mock-notification-service-adapter';
import { RemoteNotificationServiceAdapter } from '../adapters/remote-notification-service-adapter';
import { HybridNotificationServiceAdapter } from '../adapters/hybrid-notification-service-adapter';
import type { INotificationAdapter, INotificationService } from '../types/notification-service';
import { NotificationService } from '../service/notification-service';

/**
 * Notification Service 工厂，支持 mock/remote/hybrid，自动降级，支持 apiBaseUrl
 */
export class NotificationServiceFactory {
  static createService(
    type?: 'mock' | 'remote' | 'hybrid',
    apiBaseUrl?: string
  ): INotificationService {
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'mock' : 'remote';
    }
    let adapter: INotificationAdapter;
    switch (finalType) {
      case 'mock':
        adapter = new MockNotificationServiceAdapter();
        break;
      case 'remote':
        adapter = new RemoteNotificationServiceAdapter(apiBaseUrl); 
        break;
      case 'hybrid':
        adapter = new HybridNotificationServiceAdapter(apiBaseUrl); 
        break;
      default:
        throw new Error(`Unknown notification service type: ${finalType}`);
    }
    return new NotificationService(adapter);
  }
}
