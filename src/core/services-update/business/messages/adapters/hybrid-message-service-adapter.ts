import { IMessageService } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';

/**
 * HybridMessageServiceAdapter
 * 先查本地（mock），本地无数据时拉取远程
 */
export class HybridMessageServiceAdapter implements IMessageService {
  private local: IMessageService;
  private remote: IMessageService;

  constructor(local: IMessageService, remote: IMessageService) {
    this.local = local;
    this.remote = remote;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const localMsgs = await this.local.getUserMessages(userId);
    if (localMsgs.length > 0) return localMsgs;
    return this.remote.getUserMessages(userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const localMsgs = await this.local.getConversationMessages(conversationId);
    if (localMsgs.length > 0) return localMsgs;
    return this.remote.getConversationMessages(conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    // 先本地写入，再远程同步
    const msg = await this.local.sendMessage(data);
    this.remote.sendMessage(data).catch(() => {});
    return msg;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const msg = await this.local.updateMessage(messageId, data);
    this.remote.updateMessage(messageId, data).catch(() => {});
    return msg;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.local.deleteMessage(messageId);
    this.remote.deleteMessage(messageId).catch(() => {});
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.local.markAsRead(messageId);
    this.remote.markAsRead(messageId).catch(() => {});
  }
}
