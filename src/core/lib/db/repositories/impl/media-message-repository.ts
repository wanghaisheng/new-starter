import { IMessageRepository } from './message-repository';
import { CreateMessageData, UpdateMessageData, Message, MessageType } from '@/core/lib/db/types/message.types';
import { ImageService } from '@/core/services/infrastructure/image/service/image-service';

function isMediaMessageData(data: CreateMessageData): data is Extract<CreateMessageData, { type: MessageType.IMAGE | MessageType.VIDEO }> {
  return data.type === MessageType.IMAGE || data.type === MessageType.VIDEO;
}

export class MediaMessageRepository implements IMessageRepository {
  constructor(private dataService: any, private imageService: ImageService) {}

  async getMessages(userOrConvId: string): Promise<Message[]> {
    const msgs = await this.dataService.queryMessages({ userOrConvId, type: [MessageType.IMAGE, MessageType.VIDEO] });
    // 补全媒体URL（异步获取）
    return Promise.all(msgs.map(async (msg: Message) => {
      let mediaUrl: string | undefined = undefined;
      if (msg.mediaKey) {
        try {
          mediaUrl = await this.imageService.getImageUrl(msg.mediaKey);
        } catch {}
      }
      return { ...msg, mediaUrl };
    }));
  }

  async saveMessage(data: CreateMessageData): Promise<Message> {
    if (!isMediaMessageData(data)) throw new Error('MediaMessageRepository 只支持图片/视频消息');
    if (!data.mediaFile || !data.filename || !data.contentType) throw new Error('缺少媒体文件信息');
    const uploadRes = await this.imageService.uploadImage(data.mediaFile, data.filename, data.contentType);
    const msg = await this.dataService.saveMessage({ ...data, mediaKey: uploadRes.key });
    const mediaUrl = uploadRes.url || (await this.imageService.getImageUrl(uploadRes.key));
    return { ...msg, mediaUrl };
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    return this.dataService.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    // 可扩展：同步删除 imageService 媒体
    return this.dataService.deleteMessage(messageId);
  }
}
