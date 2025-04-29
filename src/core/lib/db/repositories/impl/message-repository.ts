import type { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message.types';
import type { IMessageDataService } from '../../../services/data/message-data-service';

export interface IMessageRepository {
  getMessages(conversationId: string): Promise<Message[]>;
  saveMessage(data: CreateMessageData): Promise<Message>;
  updateMessage?(messageId: string, data: UpdateMessageData): Promise<Message>;
  deleteMessage?(messageId: string): Promise<void>;
  // 可扩展更多仓储方法
}

export class MessageRepository implements IMessageRepository {
  constructor(private dataService: IMessageDataService) {}

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.dataService.getMessages(conversationId);
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    return this.dataService.saveMessage(data);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (!this.dataService.updateMessage) throw new Error('updateMessage not implemented');
    return this.dataService.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.dataService.deleteMessage) throw new Error('deleteMessage not implemented');
    return this.dataService.deleteMessage(messageId);
  }
}
