import { IMessageRepository } from '@/core/lib/db/repositories/types/message-repository.types';
import { CreateMessageData, UpdateMessageData, Message, MessageType } from '@/core/lib/db/types/message.types';
import { ImageService } from '@/core/services/infrastructure/image/service/image-service';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { messageSchema } from '@/core/lib/db/schema/definitions/message-schema';
import { BaseRepository } from './base-repository';
import { IDataService } from '@/core/services/data/types';

const mediaConverter = new EntityConverter<Message>(messageSchema);

function isMediaMessageData(data: CreateMessageData): data is Extract<CreateMessageData, { type: MessageType.IMAGE | MessageType.VIDEO }> {
  return data.type === MessageType.IMAGE || data.type === MessageType.VIDEO;
}
export class MediaMessageRepository extends BaseRepository<Message, Message> implements IMessageRepository {

  constructor(dataService: IDataService<Message>,private imageService: ImageService) {

    super(dataService as any, 'messages', mediaConverter);

  }

  async getMessages(userOrConvId: string): Promise<Message[]> {
    if (!userOrConvId) throw new Error('userOrConvId 不能为空');
    const results = await this.client.query(this.table, { where: { userOrConvId, type: [MessageType.IMAGE, MessageType.VIDEO] } });
    if (results && results.items && results.items.length > 0) {
      return Promise.all(results.items.map(async (item: any) => {
        const msg = this.converter.fromDatabase(item);
        if (!msg || typeof msg !== "object" || !msg.id || !msg.type) throw new Error('数据库返回的消息数据不完整');
        let mediaUrl: string | undefined = undefined;
        if (msg.mediaKey) {
          try {
            mediaUrl = await this.imageService.getImageUrl(msg.mediaKey);
          } catch {}
        }
        return { ...msg, mediaUrl } as Message & { mediaUrl?: string };
      }));
    }
    return [];
  }

  async findByUserId(userId: string): Promise<Message[]> {
    if (!userId) throw new Error('userId 不能为空');
    const results = await this.client.query(this.table, { where: { userId, type: [MessageType.IMAGE, MessageType.VIDEO] } });
    if (results && results.items && results.items.length > 0) {
      return Promise.all(results.items.map(async (item: any) => {
        const msg = this.converter.fromDatabase(item);
        if (!msg || typeof msg !== "object" || !msg.id || !msg.type) throw new Error('数据库返回的消息数据不完整');
        let mediaUrl: string | undefined = undefined;
        if (msg.mediaKey) {
          try {
            mediaUrl = await this.imageService.getImageUrl(msg.mediaKey);
          } catch {}
        }
        return { ...msg, mediaUrl } as Message & { mediaUrl?: string };
      }));
    }
    return [];
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    if (!conversationId) throw new Error('conversationId 不能为空');
    const results = await this.client.query(this.table, { where: { conversationId, type: [MessageType.IMAGE, MessageType.VIDEO] } });
    if (results && results.items && results.items.length > 0) {
      return Promise.all(results.items.map(async (item: any) => {
        const msg = this.converter.fromDatabase(item);
        if (!msg || typeof msg !== "object" || !msg.id || !msg.type) throw new Error('数据库返回的消息数据不完整');
        let mediaUrl: string | undefined = undefined;
        if (msg.mediaKey) {
          try {
            mediaUrl = await this.imageService.getImageUrl(msg.mediaKey);
          } catch {}
        }
        return { ...msg, mediaUrl } as Message & { mediaUrl?: string };
      }));
    }
    return [];
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    if (!isMediaMessageData(data)) throw new Error('MediaMessageRepository 只支持图片/视频消息');
    if (!data.mediaFile || !data.filename || !data.contentType) throw new Error('缺少媒体文件信息');
    const uploadRes = await this.imageService.uploadImage(data.mediaFile, data.filename, data.contentType);
    const dbRecord = this.converter.toDatabase({ ...(data as unknown as Message), mediaKey: uploadRes.key });
    const saved = await this.client.create(this.table, dbRecord);
    const msg = this.converter.fromDatabase(saved);
    const mediaUrl = uploadRes.url || (await this.imageService.getImageUrl(uploadRes.key));
    return { ...msg, mediaUrl };
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (!messageId) throw new Error('messageId 不能为空');
    if (!data) throw new Error('更新数据不能为空');
    const dbRecord = this.converter.toDatabase({ ...data } as Message);
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
      try {
        await this.markAsRead(id);
        count++;
      } catch {}
    }
    return count;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!messageId) throw new Error('messageId 不能为空');
    // 可扩展：同步删除 imageService 媒体
    await this.client.delete(this.table, messageId);
  }

  async findById(messageId: string): Promise<Message | null> {
    if (!messageId) throw new Error('messageId 不能为空');
    const result = await this.client.findById(this.table, messageId);
    if (!result) return null;
    const msg = this.converter.fromDatabase(result);
    if (!msg || typeof msg !== "object" || !msg.id || !msg.type) throw new Error('数据库返回的消息数据不完整');
    let mediaUrl: string | undefined = undefined;
    if (msg.mediaKey) {
      try {
        mediaUrl = await this.imageService.getImageUrl(msg.mediaKey);
      } catch {}
    }
    return { ...msg, mediaUrl } as Message & { mediaUrl?: string };
  }

}
