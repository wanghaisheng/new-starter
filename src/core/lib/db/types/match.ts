import { BaseEntity } from './base-entity';

/**
 * 匹配实体接口
 * 表示两个用户之间的匹配关系
 * 
 * @description
 * 表示Dating App中两个用户之间的匹配关系
 * 跟踪匹配状态，支持待处理、已匹配和已拒绝三种状态
 */
export interface Match extends BaseEntity {
  /** 
   * 用户ID对
   * 表示匹配中的两个用户ID
   */
  users: [string, string];
  
  /**
   * 匹配状态
   * - pending: 待处理
   * - matched: 已匹配
   * - rejected: 已拒绝
   */
  status: 'pending' | 'matched' | 'rejected';
}

/**
 * 匹配创建接口
 * 用于创建新匹配时的数据类型
 */
export interface CreateMatchData {
  users: [string, string];
  status?: 'pending' | 'matched' | 'rejected';
}

/**
 * 匹配更新接口
 * 用于更新匹配时的数据类型
 */
export interface UpdateMatchData {
  status?: 'pending' | 'matched' | 'rejected';
}

/**
 * 匹配操作实体接口
 * 表示用户对潜在匹配对象的操作
 * 
 * @description
 * 表示用户对潜在匹配对象执行的操作，如喜欢、不喜欢或超级喜欢
 * 用于匹配算法和推荐系统
 */
export interface MatchAction extends BaseEntity {
  /** 执行操作的用户ID */
  userId: string;
  
  /** 操作目标用户ID */
  targetUserId: string;
  
  /**
   * 操作类型
   * - like: 喜欢
   * - dislike: 不喜欢
   * - superlike: 超级喜欢
   */
  action: 'like' | 'dislike' | 'superlike';
}