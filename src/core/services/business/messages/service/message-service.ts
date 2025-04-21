// 消息服务实现，聚合消息适配器，暴露统一消息业务 API
import { IMessageService, IMessageAdapter } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';

export class MessageService implements IMessageService {
  private adapter: IMessageAdapter;

  constructor(adapter: IMessageAdapter) {
    this.adapter = adapter;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.adapter.getUserMessages(userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.adapter.getConversationMessages(conversationId);
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
