import { BaseEntity } from './base-entity';

/**
 * 匹配实体类型
 */
export interface Match extends BaseEntity {
  id: string;
  userAId: string;
  userBId: string;
  status: 'pending' | 'active' | 'closed' | string;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 匹配统计类型
 * 用于统计报表、聚合分析等场景
 */
export interface MatchStats {
  totalMatches: number;
  activeMatches: number;
  todayMatches: number;
  ext: Record<string, any>;
}

export interface CreateMatchData {
  userAId: string;
  userBId: string;
  // 其它创建时需要的字段
  ext?: Record<string, any>;
}

export interface UpdateMatchData {
  status?: 'pending' | 'active' | 'closed' | string;
  ext?: Record<string, any>;
}