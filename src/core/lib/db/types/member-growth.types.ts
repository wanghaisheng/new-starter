// 会员成长配置类型定义
import { BaseEntity } from './base-entity';

export interface MemberGrowth extends BaseEntity {
  userId: string;
  level: number;
  exp: number;
  ext?: Record<string, any>;
}

export interface MemberGrowthConfig {
  version: string;
  items: MemberGrowth[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
