import { useState, useEffect, useCallback, useRef } from 'react';
// import { NotificationServiceRegistry } from '@/core/services/infrastructure/notifications/registry/notification-service-registry';
import type { Notification } from '@/core/lib/db/types/notification.types';
// import type { INotificationService } from '@/core/services/infrastructure/notifications/types/notification-service';
import { useToast } from './useToast';
import { useService } from '@/src/providers/ServiceProvider';

export interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  fetchError: Error | null;
  updateError: Error | null;
  deleteError: Error | null;
  empty: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(userId: string): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [updateError, setUpdateError] = useState<Error | null>(null);
  const [deleteError, setDeleteError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  // const serviceRef = useRef<INotificationService | null>(null);
  const { userService } = useService(); // 统一入口，后续可扩展 notificationService
  const notificationService = userService.getNotificationService?.(); // 假设 userService 下挂载 notificationService

  const fetchNotifications = useCallback(async (uid: string) => {
    setLoading(true);
    setFetchError(null);
    setEmpty(false);
    try {
      if (!notificationService) throw new Error('通知服务未初始化');
      const data: Notification[] = await notificationService.getUserNotifications(uid);
      setNotifications(data);
      setEmpty(data.length === 0);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('获取通知失败');
      setFetchError(error);
      setEmpty(true);
      triggerToast(error.message);
    } finally {
      setLoading(false);
    }
  }, [notificationService, triggerToast]);

  useEffect(() => {
    if (userId) fetchNotifications(userId);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setUpdateError(null);
    try {
      if (!notificationService) throw new Error('通知服务未初始化');
      await notificationService.markAsRead(notificationId);
      await fetchNotifications(userId);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('标记已读失败');
      setUpdateError(error);
      triggerToast(error.message);
    }
  }, [notificationService, userId, fetchNotifications, triggerToast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setDeleteError(null);
    try {
      if (!notificationService) throw new Error('通知服务未初始化');
      await notificationService.deleteNotification(notificationId);
      await fetchNotifications(userId);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('删除通知失败');
      setDeleteError(error);
      triggerToast(error.message);
    }
  }, [notificationService, userId, fetchNotifications, triggerToast]);

  return {
    notifications,
    loading,
    fetchError,
    updateError,
    deleteError,
    empty,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  };
}
