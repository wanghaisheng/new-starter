import { IMessageRepository } from './message-repository';
import { CreateMessageData, UpdateMessageData, Message, MessageType } from '@/core/lib/db/types/message.types';

export class HybridMessageRepository implements IMessageRepository {
  constructor(private repos: { text: IMessageRepository; media: IMessageRepository }) {}

  async getMessages(userOrConvId: string): Promise<Message[]> {
    // 合并文本和媒体消息
    const textMsgs = await this.repos.text.getMessages(userOrConvId);
    const mediaMsgs = await this.repos.media.getMessages(userOrConvId);
    return [...textMsgs, ...mediaMsgs].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    if (data.type === MessageType.TEXT) {
      return this.repos.text.saveMessage(data);
    } else if (data.type === MessageType.IMAGE || data.type === MessageType.VIDEO) {
      return this.repos.media.saveMessage(data);
    }
    throw new Error('HybridMessageRepository: 不支持的消息类型 ' + data.type);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (data.type === MessageType.TEXT) {
      if (!this.repos.text.updateMessage) throw new Error('text repo 不支持 updateMessage');
      return this.repos.text.updateMessage(messageId, data);
    } else if (data.type === MessageType.IMAGE || data.type === MessageType.VIDEO) {
      if (!this.repos.media.updateMessage) throw new Error('media repo 不支持 updateMessage');
      return this.repos.media.updateMessage(messageId, data);
    }
    throw new Error('HybridMessageRepository: 不支持的消息类型 ' + data.type);
  }

  async deleteMessage(messageId: string): Promise<void> {
    const ps: Promise<any>[] = [];
    if (this.repos.text.deleteMessage) ps.push(this.repos.text.deleteMessage(messageId));
    if (this.repos.media.deleteMessage) ps.push(this.repos.media.deleteMessage(messageId));
    if (ps.length === 0) throw new Error('HybridMessageRepository: 没有可用的 deleteMessage 实现');
    await Promise.all(ps);
  }
}
