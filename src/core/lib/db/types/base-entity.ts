/**
 * 基础实体类型
 * 所有数据库实体都应该继承这个类型
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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
 * 实体创建类型
 * 用于创建新实体时的数据类型
 */
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
  createdAt: Date;
  updatedAt: Date;
}; 