// 皮肤商城配置类型定义
import { BaseEntity } from './base-entity';
import { EntityStatus } from './common';

/**
 * 皮肤/主题主类型
 */
export interface Skin extends BaseEntity {
  id: string;
  name: string;
  previewUrl: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 皮肤/主题聚合类型
 */
export interface SkinStats {
  total: number;
  active: number;
  inactive: number;
  ext: Record<string, any>;
}

/**
 * 皮肤/主题创建类型
 */
export interface SkinCreate {
  name: string;
  previewUrl: string;
  ext?: Record<string, any>;
}

/**
 * 皮肤/主题更新类型
 */
export interface SkinUpdate {
  name?: string;
  previewUrl?: string;
  status?: EntityStatus;
  ext?: Record<string, any>;
}
