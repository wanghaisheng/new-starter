// 互动相关类型定义
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
  createdAt: string;
  updatedAt: string;
  resolution?: {
    action: 'warning' | 'suspension' | 'ban';
    note: string;
    resolvedAt: string;
  };
  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 屏蔽实体接口
 * 表示用户对其他用户的屏蔽信息
 */
export interface Block extends BaseEntity {
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
  expiresAt?: string;
  /** 扩展字段 */
  ext?: Record<string, any>;
}
