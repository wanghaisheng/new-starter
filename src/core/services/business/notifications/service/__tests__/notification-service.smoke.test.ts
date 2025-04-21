import { NotificationService } from '@/core/services/business/notifications/service/notification-service';
import { MockNotificationServiceAdapter } from '@/core/services/business/notifications/adapters/mock-notification-service-adapter';

describe('NotificationService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const adapter = new MockNotificationServiceAdapter();
    const service = new NotificationService(adapter);
    expect(service).toBeDefined();
    const notifications = await service.getUserNotifications('test-user');
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications[0]?.content).toBe('欢迎使用');
    await expect(service.markAsRead('1')).resolves.toBeUndefined();
    await expect(service.deleteNotification('1')).resolves.toBeUndefined();
    if (service.sendNotification) {
      await expect(service.sendNotification({ to: 'test-user', content: 'hi' })).resolves.toBeUndefined();
    }
  });
});
