import { BaseEntity } from './base-entity';

/**
 * 通知实体类型
 */
export interface Notification extends BaseEntity {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  status: 'unread' | 'read';
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 通知统计类型
 * 用于未读统计、聚合展示等场景
 */
export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
  ext: Record<string, any>;
}
