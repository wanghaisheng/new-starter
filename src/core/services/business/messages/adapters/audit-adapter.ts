// 消息审计适配器基础结构
import { IMessageAdapter } from "../types/message-service";
import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

// 仅在本文件内部定义 AuditLog 类型
export type AuditLog = {
  id: string;
  messageId: string;
  action: string;
  operator: string;
  timestamp: number;
  details?: Record<string, any>;
};

export class AuditAdapter implements IMessageAdapter {
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
  async auditMessage(id: string): Promise<AuditLog> {
    // TODO: 实现消息审计逻辑
    throw new Error("Not implemented");
  }
  // 可扩展更多审计相关方法
}