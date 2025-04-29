// 富媒体增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class MediaEnhancer implements IMessageEnhancer {
  async beforeSend(data: CreateMessageData): Promise<CreateMessageData> {
    // 处理图片/音视频
    return data;
  }
}
