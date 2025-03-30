import { BaseEntity } from '../types/base-entity';
import { Match as MatchType } from '../types/dating';

/**
 * 匹配模型类
 * 实现Dating App的匹配数据模型
 */
export class Match implements MatchType, BaseEntity {
  id: string;
  users: [string, string]; // 用户ID对
  status: 'pending' | 'matched' | 'rejected';
  createdAt: Date;
  updatedAt: Date;

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
   */
  toRecord() {
    return {
      ...this,
      users: JSON.stringify(this.users),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建匹配对象
   */
  static fromRecord(record: any): Match {
    return new Match({
      ...record,
      users: typeof record.users === 'string' ? JSON.parse(record.users) : record.users
    });
  }
}