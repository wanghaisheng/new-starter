// 会员成长任务配置类型定义
import { BaseEntity } from './base-entity';

export interface MemberGrowthTask extends BaseEntity {
  userId: string;
  taskId: string;
  status: string;
  progress: number;
  ext?: Record<string, any>;
}

export interface MemberGrowthTaskConfig {
  version: string;
  items: MemberGrowthTask[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
