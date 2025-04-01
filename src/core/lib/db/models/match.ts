import { BaseEntity } from '../types/base-entity';
import { Match as MatchType } from '../types/match';

/**
 * 匹配模型类
 * 实现Dating App的匹配数据模型
 * 
 * @description
 * 表示用户之间的匹配关系，包含匹配状态和用户ID对
 * 支持待处理、已匹配和已拒绝三种状态
 */
export class Match implements MatchType, BaseEntity {
  /** 匹配唯一标识符 */
  id: string;
  /** 用户ID对 */
  users: [string, string];
  /** 匹配状态 */
  status: 'pending' | 'matched' | 'rejected';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;

  /**
   * 创建匹配实例
   * @param data 匹配数据，可以是部分数据
   */
  constructor(data: Partial<Match>) {
    Object.assign(this, data);
    
    // 确保日期字段是Date类型
    if (data.createdAt && !(data.createdAt instanceof Date)) {
      this.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && !(data.updatedAt instanceof Date)) {
      this.updatedAt = new Date(data.updatedAt);
    }
    
    // 设置默认值
    if (!this.status) this.status = 'pending';
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
  }

  /**
   * 转换为数据库记录
   * @returns 适合存储的数据库记录对象
   */
  toRecord(): Record<string, any> {
    return {
      ...this,
      users: JSON.stringify(this.users),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建匹配对象
   * @param record 数据库记录
   * @returns 匹配实例
   */
  static fromRecord(record: Record<string, any>): Match {
    return new Match({
      ...record,
      users: typeof record.users === 'string' ? JSON.parse(record.users) : record.users,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
    });
  }
}