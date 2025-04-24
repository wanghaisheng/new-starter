// 会员成长配置类型定义
import { BaseEntity } from './base-entity';

/**
 * 会员成长主类型
 */
export interface MemberGrowth extends BaseEntity {
  userId: string;
  level: number;
  exp: number;
  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 会员成长配置类型
 */
export interface MemberGrowthConfig {
  version: string;
  items: MemberGrowth[];
  updatedAt: string;
  updatedBy: string;
  /** 元数据扩展字段 */
  metadata?: Record<string, any>;
  /** 扩展字段 */
  ext?: Record<string, any>;
}
