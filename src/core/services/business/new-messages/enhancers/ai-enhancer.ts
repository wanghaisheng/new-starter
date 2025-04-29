// AI 智能增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class AIEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // AI 智能补全、内容增强等
    return data;
  }
  async afterSend(msg: Message): Promise<Message> {
    // AI 后处理
    return msg;
  }
}
