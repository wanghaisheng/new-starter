// 内容安全过滤适配器
// 用于实现消息内容的安全过滤与合规检测

import { IMessageAdapter } from "../types/message-service";
import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

export interface ContentSafetyFilterAdapterOptions {
  // 可扩展配置项，如敏感词库、过滤规则等
}

export class ContentSafetyFilterAdapter implements IMessageAdapter {
  private options: ContentSafetyFilterAdapterOptions;

  constructor(options: ContentSafetyFilterAdapterOptions = {}) {
    this.options = options;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    throw new Error("Not implemented");
  }
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    throw new Error("Not implemented");
  }
  async getMessagesByPage(conversationId: string, page: number, pageSize: number): Promise<Message[]> {
    throw new Error("Not implemented");
  }
  async sendMessage(data: CreateMessageData): Promise<Message> {
    throw new Error("Not implemented");
  }
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    throw new Error("Not implemented");
  }
  async deleteMessage(messageId: string): Promise<void> {
    throw new Error("Not implemented");
  }
  async markAsRead(messageId: string): Promise<void> {
    throw new Error("Not implemented");
  }
  async sendRichMessage?(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: Message["type"];
    mediaUrl?: string;
    ext?: Record<string, any>;
  }): Promise<Message> {
    throw new Error("Not implemented");
  }
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    throw new Error("Not implemented");
  }
  // 可扩展内容安全相关方法
}