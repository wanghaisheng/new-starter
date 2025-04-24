import { BaseEntity } from './base-entity';

/**
 * 消息实体类型
 */
export interface Message extends BaseEntity {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  ext: Record<string, any>;
}

/**
 * 消息会话聚合类型
 * 用于消息列表、聚合展示等场景
 */
export interface MessageThread {
  threadId: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  ext: Record<string, any>;
}

/**
 * 消息创建类型（用于发送消息）
 */
export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image';
  mediaUrl?: string;
  ext?: Record<string, any>;
}

/**
 * 消息更新类型（用于编辑消息）
 */
export interface UpdateMessageData {
  content?: string;
  type?: 'text' | 'image';
  mediaUrl?: string;
  ext?: Record<string, any>;
}
