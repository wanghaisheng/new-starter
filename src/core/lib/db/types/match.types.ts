// 匹配相关类型定义
import { BaseEntity } from './base-entity';
import { User } from '.\/user.types';

/**
 * 匹配实体接口
 * 表示两个用户之间的匹配关�? * 
 * @description
 * 表示Dating App中两个用户之间的匹配关系
 * 跟踪匹配状态，支持待处理、已匹配和已拒绝三种状�? */
export interface Match extends BaseEntity {
  /** 
   * 用户ID�?   * 表示匹配中的两个用户ID
   */
  users: [string, string];
  
  /**
   * 匹配状�?   * - pending: 待处�?   * - matched: 已匹�?   * - rejected: 已拒�?   */
  status: 'pending' | 'matched' | 'rejected';
  
  /**
   * 匹配用户详情（可选）
   * 页面展示时可用，便于前端直接渲染
   */
  userDetails?: any[];
  
  /**
   * 扩展字段（可选）
   * 用于存储额外的匹配信�?   */
  ext?: Record<string, any>;
}

/**
 * 匹配创建接口
 * 用于创建新匹配时的数据类�? */
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
 * 表示用户对潜在匹配对象执行的操作，如喜欢、不喜欢或超级喜�? * 用于匹配算法和推荐系�? */
export interface MatchAction extends BaseEntity {
  /** 执行操作的用户ID */
  userId: string;
  
  /** 操作目标用户ID */
  targetUserId: string;
  
  /**
   * 操作类型
   * - like: 喜欢
   * - dislike: 不喜�?   * - superlike: 超级喜欢
   */
  action: 'like' | 'dislike' | 'superlike';
}
