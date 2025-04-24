// 消息服务实现，聚合消息适配器，暴露统一消息业务 API
import type { IMessageService, IMessageAdapter, MessageServiceType, MessageServiceOptions } from '../types/message-service';
import { MessageServiceFactory } from '../factory/message-service-factory';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';

export class MessageService implements IMessageService {
  private adapter: IMessageAdapter;

  constructor(type: MessageServiceType = 'mock', options: MessageServiceOptions = {}) {
    this.adapter = MessageServiceFactory.getAdapter(type, options) ?? MessageServiceFactory.getAdapter('mock')!;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.adapter.getUserMessages(userId);
  }

  async getConversationMessages(params: { conversationId: string; page?: number; pageSize?: number }): Promise<Message[]> {
    // 兼容适配器只支持 conversationId 的情况
    if ('page' in params || 'pageSize' in params) {
      // 若适配器支持分页，可调用分页方法，否则降级为全部获取
      // 这里假设 getMessagesByPage 支持分页
      return this.adapter.getMessagesByPage(params.conversationId, params.page ?? 1, params.pageSize ?? 20);
    }
    return this.adapter.getConversationMessages(params.conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    return this.adapter.sendMessage(data);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    return this.adapter.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.adapter.deleteMessage(messageId);
  }

  async markAsRead(messageId: string): Promise<void> {
    return this.adapter.markAsRead(messageId);
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    return this.adapter.getMessagesByPage(matchId, page, pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    return this.adapter.sendRichMessage(data);
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    return this.adapter.onMessageChange(callback);
  }
  // 可扩展聚合业务方法，如多端聚合、青少年安全等
}
