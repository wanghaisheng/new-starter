// 加密增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class EncryptionEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // 加密处理
    return data;
  }
  async afterSend(msg: Message): Promise<Message> {
    // 解密处理
    return msg;
  }
}
