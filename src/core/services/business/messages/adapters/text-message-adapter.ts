// 文本消息适配器实现
import { MessageAdapterBase } from './base/message-adapter-base';
import type { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message.types';

export class TextMessageAdapter extends MessageAdapterBase {
  async getUserMessages(userId: string): Promise<Message[]> {
    // TODO: 实现文本消息的用户消息获取逻辑
    throw new Error('getUserMessages 未实现');
  }
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    // TODO: 实现文本消息的会话消息获取逻辑
    throw new Error('getConversationMessages 未实现');
  }
  async getMessagesByPage(conversationId: string, page: number, pageSize: number): Promise<Message[]> {
    // TODO: 实现分页获取文本消息
    throw new Error('getMessagesByPage 未实现');
  }
  async sendMessage(data: CreateMessageData): Promise<Message> {
    // TODO: 实现文本消息发送逻辑
    throw new Error('sendMessage 未实现');
  }
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    // TODO: 实现文本消息更新逻辑
    throw new Error('updateMessage 未实现');
  }
  async deleteMessage(messageId: string): Promise<void> {
    // TODO: 实现文本消息删除逻辑
    throw new Error('deleteMessage 未实现');
  }
  async markAsRead(messageId: string): Promise<void> {
    // TODO: 实现文本消息标记已读逻辑
    throw new Error('markAsRead 未实现');
  }
}