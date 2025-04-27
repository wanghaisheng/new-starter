import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationServiceRegistry } from '@/core/services/infrastructure/notifications/registry/notification-service-registry';
import type { Notification } from '@/core/lib/db/types/notification.types';
import type { INotificationService } from '@/core/services/infrastructure/notifications/types/notification-service';
import { useToast } from './useToast';

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
  const serviceRef = useRef<INotificationService | null>(null);

  const fetchNotifications = useCallback(async (uid: string) => {
    setLoading(true);
    setFetchError(null);
    setEmpty(false);
    try {
      if (!serviceRef.current) throw new Error('通知服务未初始化');
      const data: Notification[] = await serviceRef.current.getUserNotifications(uid);
      setNotifications(data);
      setEmpty(data.length === 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取通知失败');
      setFetchError(error);
      setEmpty(true);
      triggerToast(error.message);
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    const type = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE as 'mock' | 'remote' | 'hybrid' | undefined || (process.env.NODE_ENV === 'development' ? 'mock' : 'remote');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      serviceRef.current = NotificationServiceRegistry.getInstance().createService(type as any, apiBaseUrl) as INotificationService;
    } catch (e) {
      setFetchError(e instanceof Error ? e : new Error('通知服务初始化失败'));
      setEmpty(true);
      triggerToast(e instanceof Error ? e.message : '通知服务初始化失败');
      return;
    }
    if (userId) fetchNotifications(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchNotifications, process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE, process.env.NEXT_PUBLIC_API_URL]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setLoading(true);
    setUpdateError(null);
    try {
      if (!serviceRef.current) throw new Error('通知服务未初始化');
      await serviceRef.current.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      triggerToast('通知已标记为已读');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('标记通知为已读失败');
      setUpdateError(error);
      triggerToast(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setLoading(true);
    setDeleteError(null);
    try {
      if (!serviceRef.current) throw new Error('通知服务未初始化');
      await serviceRef.current.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      triggerToast('通知已删除');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('删除通知失败');
      setDeleteError(error);
      triggerToast(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

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
