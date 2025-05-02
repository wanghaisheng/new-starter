// 多端同步增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class MultiDeviceSyncEnhancer implements IMessageEnhancer {
  async afterSend(msg: Message): Promise<Message> {
    // 多端同步
    return msg;
  }
}
