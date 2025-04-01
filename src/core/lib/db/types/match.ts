import { BaseEntity } from './base-entity';

/**
 * 匹配实体接口
 * 表示两个用户之间的匹配关系
 */
export interface Match extends BaseEntity {
  users: [string, string]; // 用户ID对
  status: 'pending' | 'matched' | 'rejected';
}

/**
 * 匹配操作实体接口
 * 表示用户对潜在匹配对象的操作
 */
export interface MatchAction extends BaseEntity {
  userId: string;
  targetUserId: string;
  action: 'like' | 'dislike' | 'superlike';
  createdAt: Date;
}