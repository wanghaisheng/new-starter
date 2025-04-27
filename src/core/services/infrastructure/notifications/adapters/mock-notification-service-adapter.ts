import type { INotificationAdapter } from '../types/notification-service';
import type { Notification } from '@/core/lib/db/types/notification';

export class MockNotificationServiceAdapter implements INotificationAdapter {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    // 返回 mock 通知
    return [
      { id: '1', type: 'system', content: '欢迎使用', createdAt: new Date().toISOString(), read: false },
    ];
  }
  async markAsRead(notificationId: string): Promise<void> {
    // mock: 不做实际操作
    return;
  }
  async deleteNotification(notificationId: string): Promise<void> {
    // mock: 不做实际操作
    return;
  }
}
