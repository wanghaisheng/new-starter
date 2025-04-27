import { BaseEntity } from './base-entity';
import { EntityStatus } from './common';

/**
 * 照片主类型
 * 存储用户上传的照片数据，包括URL、顺序、是否为头像、主要照片等
 * 用于用户资料展示、匹配推荐等业务场景
 */
export interface Photo extends BaseEntity {
  id: string;
  userId: string;
  url: string;
  thumbnailUrl?: string;
  isAvatar?: boolean;
  isMain?: boolean;
  order?: number;
  caption?: string;
  tags?: string[];
  status?: EntityStatus;
  createdAt: string;
  updatedAt: string;
  ext?: Record<string, any>;
}

/**
 * 照片创建类型
 * 用于上传新照片
 */
export interface PhotoCreate {
  userId: string;
  url: string;
  isAvatar?: boolean;
  isMain?: boolean;
  order?: number;
  caption?: string;
  tags?: string[];
  ext?: Record<string, any>;
}

/**
 * 照片更新类型
 * 用于更新照片信息
 */
export interface PhotoUpdate {
  url?: string;
  isAvatar?: boolean;
  isMain?: boolean;
  order?: number;
  caption?: string;
  tags?: string[];
  status?: EntityStatus;
  ext?: Record<string, any>;
}

/**
 * 照片统计类型
 * 用于统计报表、聚合分析等场景
 */
export interface PhotoStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  ext?: Record<string, any>;
}