import { BaseEntity } from '../types/base-entity';
import { Message as MessageType } from '../types/message';

/**
 * 消息模型类
 * 实现Dating App的消息数据模型
 * 
 * @description
 * 表示用户之间的消息通信，支持文本和图片消息
 * 包含消息状态追踪和元数据信息
 */
export class Message implements MessageType, BaseEntity {
  /** 消息唯一标识符 */
  id: string;
  /** 关联的匹配ID */
  matchId: string;
  /** 发送者用户ID */
  senderId: string;
  /** 接收者用户ID */
  receiverId: string;
  /** 消息内容 */
  content: string;
  /** 消息类型 */
  type: 'text' | 'image';
  /** 消息状态 */
  status: 'sent' | 'delivered' | 'read';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;

  /**
   * 创建消息实例
   * @param data 消息数据，可以是部分数据
   */
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
    if (!this.type) this.type = 'text';
    if (!this.status) this.status = 'sent';
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
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建消息对象
   * @param record 数据库记录
   * @returns 消息实例
   */
  static fromRecord(record: Record<string, any>): Message {
    return new Message({
      ...record,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
    });
  }
}