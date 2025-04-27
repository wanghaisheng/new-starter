// 礼物商城配置类型定义
import { BaseEntity } from './base-entity';
import { EntityStatus } from './common';

/**
 * 礼物主类型
 */
export interface Gift extends BaseEntity {
  id: string;
  name: string;
  iconUrl: string;
  value: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 礼物统计类型
 */
export interface GiftStats {
  total: number;
  active: number;
  inactive: number;
  ext: Record<string, any>;
}

/**
 * 礼物创建类型
 */
export interface GiftCreate {
  name: string;
  iconUrl: string;
  value: number;
  ext?: Record<string, any>;
}

/**
 * 礼物更新类型
 */
export interface GiftUpdate {
  name?: string;
  iconUrl?: string;
  value?: number;
  status?: EntityStatus;
  ext?: Record<string, any>;
}

/**
 * 礼物商城配置类型定义
 */
export interface GiftConfig {
  id: string;
  createdAt: string;
  version: string;
  items: GiftItem[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}

export interface GiftItem extends BaseEntity {
  name: string;
  nameI18n?: Record<string, string>; // 多语言
  price: number;
  currency: string;
  image: string;
  category?: string;
  isActive: boolean;
  version?: string;
  region?: string;
  segment?: string;
  analyticsId?: string; // 埋点/统计ID
  permissions?: string[];
  ext?: Record<string, any>;
  unlockLevel?: number; // 新增：解锁所需会员等级
}
