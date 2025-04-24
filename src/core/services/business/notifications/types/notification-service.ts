import type { Notification } from '@/core/lib/db/types/notification.types';

// Adapter 层接口
export interface INotificationAdapter {
  getUserNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
}

// Service 层接口（可扩展聚合/编排业务方法）
export interface INotificationService {
  getUserNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  // 可扩展聚合业务方法，如批量推送、日志等
}

// Service 工厂类型定义
export type NotificationServiceType = 'mock' | 'remote' | 'hybrid';
export interface NotificationServiceOptions {
  apiBaseUrl?: string;
}
