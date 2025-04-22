/**
 * 基础实体类型
 * 所有数据库实体都应该继承这个类�? */
import { SyncableEntity } from './sync-flags';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 可同步基础实体
 * 适用于需要离线存储和远程同步的实�? */
export interface SyncableBaseEntity extends BaseEntity, SyncableEntity {
  /**
   * 表名
   * 用于指示实体所属的�?   */
  _tableName?: string;
  
  /**
   * 构造函�?   * 用于在类型层面表示EntityConstructor
   */
  constructor?: { name: string };
}

/**
 * 数据库记录类�? * 用于数据库中存储的原始记录格�? */
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
export interface SyncableDatabaseRecord extends DatabaseRecord {
  _sync?: {
    syncState: string;
    lastSyncedAt?: string;
    localModifiedAt: string;
    remoteModifiedAt?: string;
    syncAttempts?: number;
    syncPriority: string;
    version?: number | string;
    conflictResolution?: string;
    deviceId?: string;
    meta?: Record<string, any>;
  };
}

/**
 * 实体创建类型
 * 用于创建新实体时的数据类�? */
export type CreateEntityData<T> = Omit<T, keyof BaseEntity>;

/**
 * 实体更新类型
 * 用于更新实体时的数据类型
 */
export type UpdateEntityData<T> = Partial<CreateEntityData<T>>;

/**
 * 类型转换工具类型
 */
export type WithTimestamps<T> = T & {
  createdAt: string;
  updatedAt: string;
};

/**
 * 类型转换工具类型 - 添加同步信息
 */
export type WithSyncMetadata<T> = T & SyncableEntity; 
