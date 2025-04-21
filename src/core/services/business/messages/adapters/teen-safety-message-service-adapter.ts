import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IMessageAdapter } from '../types/message-service';

/**
 * 青少年安全消息适配器
 * 增强内容审核、限制夜间消息、反骚扰等
 */
export class TeenSafetyMessageServiceAdapter implements IMessageAdapter {
  private base: IMessageAdapter;
  // 可扩展：内容审核服务、夜间限制配置、黑名单等

  constructor(base: IMessageAdapter) {
    this.base = base;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const msgs = await this.base.getUserMessages(userId);
    // 可扩展：过滤不良内容、敏感消息打标
    return msgs;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.base.getConversationMessages(conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    // 夜间限制（示例：22:00-7:00禁止发送）
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 22 || hour < 7) {
      throw new Error('夜间时间段，暂不允许发送消息');
    }
    // 可扩展：内容审核、反骚扰、黑名单检查
    return this.base.sendMessage(data);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    return this.base.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.base.deleteMessage(messageId);
  }

  async markAsRead(messageId: string): Promise<void> {
    return this.base.markAsRead(messageId);
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    return this.base.getMessagesByPage(matchId, page, pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    // 夜间限制、内容审核等同 sendMessage
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 22 || hour < 7) {
      throw new Error('夜间时间段，暂不允许发送消息');
    }
    return this.base.sendRichMessage(data);
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    // 可扩展：敏感消息变更通知
    return this.base.onMessageChange(callback);
  }
}
