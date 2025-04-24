import { BaseEntity } from './base-entity';

/**
 * 用户反馈主类型
 */
export interface Feedback extends BaseEntity {
  id: string;
  userId: string;
  type: 'bug' | 'suggestion' | 'complaint' | string;
  content: string;
  status: 'pending' | 'processed' | 'closed' | string;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 反馈统计类型
 * 用于统计报表、聚合分析等场景
 */
export interface FeedbackStats {
  total: number;
  pending: number;
  processed: number;
  closed: number;
  ext: Record<string, any>;
}
