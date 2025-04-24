console.log('base-entity loaded');

/**
 * 基础实体类型
 * 所有数据库实体都应该继承这个类
 */
import { SyncableEntity } from './sync-flags';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * 可同步基础实体
 * 适用于需要离线存储和远程同步的实体
 */
export interface SyncableBaseEntity extends BaseEntity, SyncableEntity {
  _tableName?: string;
  constructor?: { name: string };
}

/**
 * 数据库记录类型
 * 用于数据库中存储的原始记录格式
 */
export interface DatabaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * 可同步数据库记录类型
 * 包含同步相关字段
 */



export type CreateEntityData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntityData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;