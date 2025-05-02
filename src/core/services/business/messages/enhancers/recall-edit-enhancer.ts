// 撤回/编辑增强器
import type { IMessageEnhancer } from '../types/message-service';
import type { Message, CreateMessageData } from '@/core/lib/db/types/message.types';

export class RecallEditEnhancer implements IMessageEnhancer {
  // 可扩展 beforeSend/afterSend 实现撤回/编辑逻辑
}
