import { NotificationService } from '@/core/services/business/notifications/service/notification-service';
import { MockNotificationServiceAdapter } from '@/core/services/business/notifications/adapters/mock-notification-service-adapter';

describe('NotificationService 单元测试', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(new MockNotificationServiceAdapter());
  });

  it('getUserNotifications: 应能获取通知列表', async () => {
    const notifications = await service.getUserNotifications('test-user');
    expect(Array.isArray(notifications)).toBe(true);
  });

  it('markAsRead: 应能标记通知为已读', async () => {
    await expect(service.markAsRead('notif-id')).resolves.not.toThrow();
  });

  it('deleteNotification: 应能删除通知', async () => {
    await expect(service.deleteNotification('notif-id')).resolves.not.toThrow();
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      getUserNotifications: () => { throw new Error('fail'); },
      markAsRead: () => { throw new Error('fail'); },
      deleteNotification: () => { throw new Error('fail'); },
    };
    const errorService = new NotificationService(errorAdapter as any);
    await expect(errorService.getUserNotifications('u')).rejects.toThrow('fail');
    await expect(errorService.markAsRead('id')).rejects.toThrow('fail');
    await expect(errorService.deleteNotification('id')).rejects.toThrow('fail');
  });
});
