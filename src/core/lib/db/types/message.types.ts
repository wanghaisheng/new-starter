// 消息相关类型定义
import { BaseEntity } from './base-entity';

/**
 * 消息实体接口
 * 表示用户之间的通信消息
 * 
 * @description
 * 表示Dating App中用户之间的消息通信，支持文本和图片消息类型
 * 包含消息状态追踪和发�?接收者信�? */
export interface Message extends BaseEntity {
  /** 发送者用户ID */
  senderId: string;
  
  /** 接收者用户ID */
  receiverId: string;
  
  /** 消息内容 */
  content: string;
  
  /** 消息类型 */
  type: string;
  
  /** 消息状�?*/
  status: string;
  
  /** 额外扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 消息创建接口
 * 用于创建新消息时的数据类�? */
export interface CreateMessageData {
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: 'text' | 'image';
}

/**
 * 消息更新接口
 * 用于更新消息时的数据类型
 */
export interface UpdateMessageData {
  status?: 'sent' | 'delivered' | 'read';
  content?: string;
}
