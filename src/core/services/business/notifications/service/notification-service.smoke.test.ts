import { NotificationService } from '@/core/services/business/notifications/service/notification-service';
import { MockNotificationServiceAdapter } from '@/core/services/business/notifications/adapters/mock-notification-service-adapter';

describe('NotificationService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new NotificationService(new MockNotificationServiceAdapter());
    expect(service).toBeDefined();
    if (service.getUserNotifications) {
      const notifications = await service.getUserNotifications('test-user');
      expect(Array.isArray(notifications)).toBe(true);
    }
    if (service.markAsRead) {
      await expect(service.markAsRead('notif-id')).resolves.not.toThrow();
    }
    if (service.deleteNotification) {
      await expect(service.deleteNotification('notif-id')).resolves.not.toThrow();
    }
  });
});
