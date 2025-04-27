import type { INotificationAdapter } from '@/core/services/infrastructure/notifications/types/notification-service';
import type { Notification } from '@/core/lib/db/types/notification';
import { MockNotificationServiceAdapter } from './mock-notification-service-adapter';
import { RemoteNotificationServiceAdapter } from './remote-notification-service-adapter';

// HybridNotificationServiceAdapter: 混合通知服务适配器
export class HybridNotificationServiceAdapter implements INotificationAdapter {
  private remote: INotificationAdapter;
  private mock: INotificationAdapter;

  constructor(apiBaseUrl?: string) {
    this.remote = new RemoteNotificationServiceAdapter(apiBaseUrl);
    this.mock = new MockNotificationServiceAdapter();
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    // 优先远程，失败降级 mock
    try {
      return await this.remote.getUserNotifications(userId);
    } catch {
      return await this.mock.getUserNotifications(userId);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    // 双写，保证本地与远程一致
    await Promise.all([
      this.remote.markAsRead(notificationId),
      this.mock.markAsRead(notificationId)
    ]);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    // 双写，保证本地与远程一致
    await Promise.all([
      this.remote.deleteNotification(notificationId),
      this.mock.deleteNotification(notificationId)
    ]);
  }
}
