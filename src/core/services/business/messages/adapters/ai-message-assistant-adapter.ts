import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IMessageAdapter } from '../types/message-service';

/**
 * AI 智能助手消息适配器
 * 支持智能回复、情感分析、破冰话题、AI辅助消息等
 */
export class AIMessageAssistantAdapter implements IMessageAdapter {
  private base: IMessageAdapter;

  constructor(base: IMessageAdapter) {
    this.base = base;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const msgs = await this.base.getUserMessages(userId);
    // 可扩展：AI情感分析、插入破冰话题等
    return msgs;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.base.getConversationMessages(conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    // 可扩展：AI辅助内容生成
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
    // 可扩展：AI自动生成表情/图片/语音建议
    return this.base.sendRichMessage(data);
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    // 可扩展：AI辅助消息推送
    return this.base.onMessageChange(callback);
  }
}
