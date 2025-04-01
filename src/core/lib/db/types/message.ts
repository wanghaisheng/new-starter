import { BaseEntity } from './base-entity';

/**
 * 消息实体接口
 * 表示用户之间的通信消息
 */
export interface Message extends BaseEntity {
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  status: 'sent' | 'delivered' | 'read';
}