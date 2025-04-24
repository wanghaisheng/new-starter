// 会员成长任务配置类型定义
import { BaseEntity } from './base-entity';

/**
 * 会员成长任务主类型
 */
export interface MemberGrowthTask extends BaseEntity {
  userId: string;
  taskId: string;
  status: string;
  progress: number;
  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 会员成长任务配置类型
 */
export interface MemberGrowthTaskConfig {
  version: string;
  items: MemberGrowthTask[];
  updatedAt: string;
  updatedBy: string;
  /** 元数据扩展字段 */
  metadata?: Record<string, any>;
  /** 扩展字段 */
  ext?: Record<string, any>;
}
