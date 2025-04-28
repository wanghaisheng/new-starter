// 消息服务核心实现
import { IMessageService, IMessageAdapter  } from "@/core/services/business/messages/types/message-service";
import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

export class MessageService implements IMessageService {
  private adapter: IMessageAdapter;

  constructor(adapter: IMessageAdapter) {
    this.adapter = adapter;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.adapter.getUserMessages(userId);
  }

  async getConversationMessages(params: { conversationId: string; page?: number; pageSize?: number }): Promise<Message[]> {
    if (params.page !== undefined && params.pageSize !== undefined) {
      return this.adapter.getMessagesByPage(params.conversationId, params.page, params.pageSize);
    }
    return this.adapter.getConversationMessages(params.conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    return this.adapter.sendMessage(data);
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    return this.adapter.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.adapter.deleteMessage(messageId);
  }

  async markAsRead(messageId: string): Promise<void> {
    return this.adapter.markAsRead(messageId);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    return this.adapter.sendRichMessage(data);
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    return this.adapter.onMessageChange(callback);
  }
}