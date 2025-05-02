import { IMessageRepository } from '@/core/lib/db/repositories/types/message-repository.types';
import { CreateMessageData, UpdateMessageData, Message } from '@/core/lib/db/types/message.types';
import { BaseRepository } from './base-repository';
import { IDataService } from '@/core/services/data/types';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { messageSchema } from '@/core/lib/db/schema/definitions/message-schema';

const userConverter = new EntityConverter<Message>(messageSchema);

export class TextMessageRepository extends BaseRepository<Message, Message> implements IMessageRepository {
  constructor(dataService: IDataService<Message>) {
    super(dataService as any, 'messages', userConverter);
  }

  async getMessages(userOrConvId: string): Promise<Message[]> {
    if (!userOrConvId) throw new Error('userOrConvId 不能为空');
    const results = await this.client.query(this.table, { where: { userOrConvId, type: 'text' } });
    if (results && results.items && results.items.length > 0) {
      return results.items.map((item: any) => this.converter.fromDatabase(item));
    }
    return [];
  }

  async findByUserId(userId: string): Promise<Message[]> {
    if (!userId) throw new Error('userId 不能为空');
    const results = await this.client.query(this.table, { where: { userId, type: 'text' } });
    if (results && results.items && results.items.length > 0) {
      return results.items.map((item: any) => this.converter.fromDatabase(item));
    }
    return [];
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    if (!conversationId) throw new Error('conversationId 不能为空');
    const results = await this.client.query(this.table, { where: { conversationId, type: 'text' } });
    if (results && results.items && results.items.length > 0) {
      return results.items.map((item: any) => this.converter.fromDatabase(item));
    }
    return [];
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    if (!data) throw new Error('消息数据不能为空');
    if (data.type !== 'text') throw new Error('TextMessageRepository 只支持文本');
    if (!data.senderId && !data.conversationId) throw new Error('userId 或 conversationId 必须存在');
    const dbRecord = this.converter.toDatabase(data as Message);
    const saved = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(saved);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (!messageId) throw new Error('messageId 不能为空');
    if (!data) throw new Error('更新数据不能为空');
    const dbRecord = this.converter.toDatabase({ ...data, type: 'text' } as Message);
    await this.client.update(this.table, messageId, dbRecord);
    const updated = await this.findById(messageId);
    if (!updated) throw new Error('消息不存在');
    return updated;
  }

  async markAsRead(messageId: string): Promise<boolean> {
    if (!messageId) throw new Error('messageId 不能为空');
    const original = await this.findById(messageId);
    if (!original) throw new Error('消息不存在');
    const dbRecord = this.converter.toDatabase({ ...original, read: true });
    await this.client.update(this.table, messageId, dbRecord);
    return true;
  }

  async markMultipleAsRead(messageIds: string[]): Promise<number> {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return 0;
    let count = 0;
    for (const id of messageIds) {
      const original = await this.findById(id);
      if (!original) continue;
      const dbRecord = this.converter.toDatabase({ ...original, read: true });
      await this.client.update(this.table, id, dbRecord);
      count++;
    }
    return count;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!messageId) throw new Error('messageId 不能为空');
    await this.client.delete(this.table, messageId);
  }
}
