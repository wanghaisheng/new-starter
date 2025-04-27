// 通知业务服务聚合层，便于扩展聚合业务逻辑
import type { INotificationService, INotificationAdapter, NotificationServiceType, NotificationServiceOptions } from '../types/notification-service';
import { NotificationServiceFactory } from '../factory/notification-service-factory';

export class NotificationService implements INotificationService {
  private adapter: INotificationAdapter;

  constructor(type: NotificationServiceType = 'mock', options: NotificationServiceOptions = {}) {
    this.adapter = NotificationServiceFactory.getAdapter(type, options) ?? NotificationServiceFactory.getAdapter('mock')!;
  }

  async getUserNotifications(userId: string) {
    return this.adapter.getUserNotifications(userId);
  }

  async markAsRead(notificationId: string) {
    return this.adapter.markAsRead(notificationId);
  }

  async deleteNotification(notificationId: string) {
    return this.adapter.deleteNotification(notificationId);
  }

  /**
   * 聚合推送业务方法，兼容 sendNotification 能力
   * @param params 通知参数
   */
  async sendNotification?(params: any): Promise<void> {
    if (typeof (this.adapter as any).sendNotification === 'function') {
      return (this.adapter as any).sendNotification(params);
    }
    throw new Error('当前通知适配器未实现 sendNotification 方法');
  }
  // 可扩展聚合业务方法，如批量推送、日志等
}
