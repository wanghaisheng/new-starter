import { BaseEntity } from '../types/base-entity';
import { Message as MessageType } from '../types/dating';

/**
 * 消息模型类
 * 实现Dating App的消息数据模型
 */
export class Message implements MessageType, BaseEntity {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  contentType: 'text' | 'image' | 'location';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Message>) {
    Object.assign(this, data);
    
    // 确保日期字段是Date类型
    if (data.createdAt && !(data.createdAt instanceof Date)) {
      this.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && !(data.updatedAt instanceof Date)) {
      this.updatedAt = new Date(data.updatedAt);
    }
    
    // 设置默认值
    if (!this.contentType) this.contentType = 'text';
    if (!this.status) this.status = 'sent';
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
  }

  /**
   * 转换为数据库记录
   */
  toRecord() {
    return {
      ...this,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建消息对象
   */
  static fromRecord(record: any): Message {
    return new Message({
      ...record
    });
  }
}