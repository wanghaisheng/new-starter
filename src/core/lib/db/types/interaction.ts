import { BaseEntity } from './base-entity';

/**
 * 举报实体接口
 * 表示用户对其他用户的举报信息
 */
export interface Report extends BaseEntity {
  reporterId: string;
  targetUserId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  resolution?: {
    action: 'warning' | 'suspension' | 'ban';
    note: string;
    resolvedAt: Date;
  };
}

/**
 * 屏蔽实体接口
 * 表示用户对其他用户的屏蔽信息
 */
export interface Block extends BaseEntity {
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
  expiresAt?: Date;
}