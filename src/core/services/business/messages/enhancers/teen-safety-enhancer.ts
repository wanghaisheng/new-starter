// 青少年安全增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class TeenSafetyEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // 青少年安全策略
    return data;
  }
}
