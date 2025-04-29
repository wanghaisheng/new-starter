import { BaseEntity } from './base-entity';
import { EntityStatus } from './common';

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  // 可扩展更多类型，如 AUDIO = 'audio', FILE = 'file'
}

/**
 * 消息实体类型
 */
export interface Message extends BaseEntity {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  status: EntityStatus;
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
 * 基础消息数据类型
 */
export interface CreateMessageDataBase {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  ext?: Record<string, any>;
}

/**
 * 多媒体消息类型（图片/视频）
 */
export interface CreateMediaMessageData extends CreateMessageDataBase {
  type: MessageType.IMAGE | MessageType.VIDEO;
  mediaFile: Buffer | Uint8Array | Blob;
  filename: string;
  contentType: string;
}

/**
 * 消息创建类型（用于发送消息）
 */
export type CreateMessageData = CreateMessageDataBase | CreateMediaMessageData;

/**
 * 消息更新类型（用于编辑消息）
 */
export interface UpdateMessageData {
  content?: string;
  type?: MessageType;
  mediaUrl?: string;
  ext?: Record<string, any>;
}
