// 皮肤商城配置类型定义
import { BaseEntity } from './base-entity';

export interface SkinItem extends BaseEntity {
  name: string;
  image: string;
  isActive: boolean;
  price?: number;
  currency?: string;
  unlockLevel?: number;
  ext?: Record<string, any>;
}

export interface SkinConfig {
  id: string;
  createdAt: string;
  version: string;
  items: SkinItem[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
