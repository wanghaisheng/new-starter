import { IMessageRepository } from './message-repository';
import { CreateMessageData, UpdateMessageData, Message } from '@/core/lib/db/types/message.types';

export class TextMessageRepository implements IMessageRepository {
  constructor(private dataService: any) {}

  async getMessages(userOrConvId: string): Promise<Message[]> {
    // 仅处理文本消息，直接查库
    return this.dataService.queryMessages({ userOrConvId, type: 'text' });
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    // 只存文本
    if (data.type !== 'text') throw new Error('TextMessageRepository 只支持文本');
    return this.dataService.saveMessage(data);
  }

  // 其它方法同理（update/delete）
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    return this.dataService.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.dataService.deleteMessage(messageId);
  }
}
