import { BaseEntity, DatabaseRecord } from './base-entity';
import { User } from './user';
import { Match } from './match';
import { Message } from './message';
import { Photo } from './photo';

/**
 * 类型转换工具
 * 提供在各种实体表示形式之间转换的函数
 * 
 * @description
 * 这个模块提供函数用于在实体对象和数据库记录之间进行转换，
 * 自动处理类型转换、序列化和反序列化
 */

/**
 * 将实体转换为数据库记录
 * 
 * @param entity 实体对象
 * @returns 数据库记录对象
 */
export function toRecord<T extends BaseEntity>(entity: T): DatabaseRecord {
  const record: Record<string, any> = {
    ...entity,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
  
  return record as DatabaseRecord;
}

/**
 * 将用户实体转换为数据库记录
 * 
 * @param user 用户实体对象
 * @returns 数据库记录对象
 */
export function userToRecord(user: User): DatabaseRecord {
  return {
    ...toRecord(user),
    birthDate: user.birthDate.toISOString(),
    lastActive: user.lastActive.toISOString(),
    photos: JSON.stringify(user.photos),
    interests: JSON.stringify(user.interests),
    location: JSON.stringify(user.location),
    preferences: JSON.stringify(user.preferences)
  };
}

/**
 * 将匹配实体转换为数据库记录
 * 
 * @param match 匹配实体对象
 * @returns 数据库记录对象
 */
export function matchToRecord(match: Match): DatabaseRecord {
  return {
    ...toRecord(match),
    users: JSON.stringify(match.users)
  };
}

/**
 * 将消息实体转换为数据库记录
 * 
 * @param message 消息实体对象
 * @returns 数据库记录对象
 */
export function messageToRecord(message: Message): DatabaseRecord {
  return toRecord(message);
}

/**
 * 将数据库记录转换为实体对象基础部分
 * 
 * @param record 数据库记录
 * @returns 包含基础字段的实体部分
 */
export function fromRecord<T extends BaseEntity>(record: DatabaseRecord): Partial<T> {
  return {
    id: record.id,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  } as Partial<T>;
}

/**
 * 将数据库记录转换为用户实体
 * 
 * @param record 数据库记录
 * @returns 用户实体对象
 */
export function recordToUser(record: DatabaseRecord): User {
  return {
    ...fromRecord<User>(record),
    name: record.name,
    phone: record.phone,
    email: record.email,
    googleId: record.googleId,
    bio: record.bio,
    birthDate: new Date(record.birthDate),
    gender: record.gender,
    photos: typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos,
    interests: typeof record.interests === 'string' ? JSON.parse(record.interests) : record.interests,
    location: typeof record.location === 'string' ? JSON.parse(record.location) : record.location,
    preferences: typeof record.preferences === 'string' ? JSON.parse(record.preferences) : record.preferences,
    isVerified: record.isVerified,
    lastActive: new Date(record.lastActive),
    status: record.status
  } as User;
}

/**
 * 将数据库记录转换为匹配实体
 * 
 * @param record 数据库记录
 * @returns 匹配实体对象
 */
export function recordToMatch(record: DatabaseRecord): Match {
  return {
    ...fromRecord<Match>(record),
    users: typeof record.users === 'string' ? JSON.parse(record.users) : record.users,
    status: record.status
  } as Match;
}

/**
 * 将数据库记录转换为消息实体
 * 
 * @param record 数据库记录
 * @returns 消息实体对象
 */
export function recordToMessage(record: DatabaseRecord): Message {
  return {
    ...fromRecord<Message>(record),
    matchId: record.matchId,
    senderId: record.senderId,
    receiverId: record.receiverId,
    content: record.content,
    type: record.type,
    status: record.status
  } as Message;
} 