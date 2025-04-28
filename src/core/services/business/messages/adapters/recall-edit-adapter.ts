// 消息撤回与编辑适配器
import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";
import { IMessageAdapter } from "../types/message-service";

export class RecallEditAdapter implements IMessageAdapter {
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
  // 可扩展撤回与编辑相关方法
}