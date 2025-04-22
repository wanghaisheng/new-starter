import { BaseEntity, DatabaseRecord } from './base-entity';
import { User } from './user.types';

/**
 * 提供在各种实体表示形式之间转换的函数
 *
 * @description
 * 这个模块提供函数用于在实体对象和数据库记录之间进行转换，
 * 自动处理类型转换、序列化和反序列化
 */

/**
 * 将实体转换为数据库记录
 * @param entity 实体对象
 * @returns 数据库记录对象
 */
export function toRecord<T extends BaseEntity>(entity: T): DatabaseRecord {
  const record: Record<string, any> = {
    ...entity,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt
  };
  return record as DatabaseRecord;
}
/**
 * 将用户实体转换为数据库记录
 * @param user 用户实体对象
 * @returns 数据库记录对象
 */
export function userToRecord(user: User): DatabaseRecord {
  return {
    ...toRecord(user),
    birthDate: user.birthDate instanceof Date ? user.birthDate.toISOString() : user.birthDate,
    lastActive: user.lastActive instanceof Date ? user.lastActive.toISOString() : user.lastActive,
    photos: Array.isArray(user.photos) ? JSON.stringify(user.photos) : user.photos,
    interests: Array.isArray(user.interests) ? JSON.stringify(user.interests) : user.interests,
    location: typeof user.location === 'object' ? JSON.stringify(user.location) : user.location,
    preferences: typeof user.preferences === 'object' ? JSON.stringify(user.preferences) : user.preferences
  };
}

/**
 * 其它实体的 toRecord 函数请参照上面写法，确保日期、对象、数组字段均做类型安全处理
 */