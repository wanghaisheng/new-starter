import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { User } from '@/core/lib/db/types/user';

// Adapter 层接口
export interface IMessageAdapter {
  getUserMessages(userId: string): Promise<Message[]>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  sendMessage(data: CreateMessageData): Promise<Message>;
  updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
  getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]>;
  sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message>;
  onMessageChange(callback: (messages: Message[]) => void): () => void;
}

// Service 层接口
export interface IMessageService {
  getUserMessages(userId: string): Promise<Message[]>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  sendMessage(data: CreateMessageData): Promise<Message>;
  updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(messageId: string): Promise<void>;
  getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]>;
  sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message>;
  onMessageChange(callback: (messages: Message[]) => void): () => void;
  // 可扩展聚合业务方法，如多端聚合、青少年安全等
}
