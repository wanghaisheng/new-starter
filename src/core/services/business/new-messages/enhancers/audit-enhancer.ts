// 审计增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class AuditEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // 内容审计、合规检查
    return data;
  }
  async afterSend(msg: Message): Promise<Message> {
    // 审计日志
    return msg;
  }
}
