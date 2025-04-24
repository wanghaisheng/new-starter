// 全局配置类型定义
import { BaseEntity } from './base-entity';

/**
 * 全局配置项类型
 */
export interface GlobalConfigItem {
  key: string;
  value: any;
  description?: string;
  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 全局配置主类型
 */
export interface GlobalConfig extends BaseEntity {
  id: string;
  createdAt: string;
  version: string;
  items: GlobalConfigItem[];
  updatedAt: string;
  updatedBy: string;
  /** 元数据扩展字段 */
  metadata?: Record<string, any>;
  /** 扩展字段 */
  ext?: Record<string, any>;
}
