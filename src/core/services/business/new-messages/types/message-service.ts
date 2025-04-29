// 消息服务类型定义

import type { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

export type MessageServiceType = 'mock' | 'local' | 'remote';

export interface MessageServiceOptions {
  [key: string]: any;
}

// 新增增强器接口
export interface IMessageEnhancer {
  beforeSend?(data: CreateMessageData): Promise<CreateMessageData>;
  afterSend?(msg: Message): Promise<Message>;
  // 可扩展 beforeUpdate、afterReceive 等增强钩子
}

export interface IMessageAdapter {
  getUserMessages(userId: string): Promise<Message[]>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  getMessagesByPage(conversationId: string, page: number, pageSize: number): Promise<Message[]>;
  sendMessage(data: CreateMessageData): Promise<Message>;
  updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
  sendRichMessage?(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: Message["type"];
    mediaUrl?: string;
    ext?: Record<string, any>;
  }): Promise<Message>;
  onMessageChange(callback: (messages: Message[]) => void): () => void;
  // 预留扩展点，如AI、同步、青少年安全等
}

export interface IMessageService {
  getUserMessages(userId: string): Promise<Message[]>;
  getConversationMessages(params: { conversationId: string; page?: number; pageSize?: number }): Promise<Message[]>;
  sendMessage(data: CreateMessageData): Promise<Message>;
  updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
  getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]>;
  sendRichMessage?(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: Message["type"];
    mediaUrl?: string;
    ext?: Record<string, any>;
  }): Promise<Message>;
  onMessageChange(callback: (messages: Message[]) => void): () => void;
  // 可扩展聚合业务方法，如多端聚合、青少年安全等
}
