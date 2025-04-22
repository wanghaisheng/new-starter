// 通知相关类型定义
import { BaseEntity } from './base-entity';

export interface Notification extends BaseEntity {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  read: boolean;
  // 可扩展更多通知属�?}
