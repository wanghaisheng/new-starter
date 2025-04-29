// 优先级分组增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class PriorityGroupEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // 优先级分组
    return data;
  }
}
