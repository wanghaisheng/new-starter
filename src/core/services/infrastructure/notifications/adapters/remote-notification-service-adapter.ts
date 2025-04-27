import type { INotificationAdapter } from '../types/notification-service';
import type { Notification } from '@/core/lib/db/types/notification';

export class RemoteNotificationServiceAdapter implements INotificationAdapter {
  private apiBaseUrl: string;
  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || '';
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    // 真实远程 API 调用（示例）
    const resp = await fetch(`${this.apiBaseUrl}/api/notifications/user/${userId}`);
    if (!resp.ok) throw new Error('获取通知失败');
    return resp.json();
  }
  async markAsRead(notificationId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/api/notifications/${notificationId}/read`, { method: 'POST' });
  }
  async deleteNotification(notificationId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/api/notifications/${notificationId}`, { method: 'DELETE' });
  }
}
