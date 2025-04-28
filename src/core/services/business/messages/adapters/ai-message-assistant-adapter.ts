// AI 消息助手适配器
// 依赖 src/core/lib/api 能力实现智能回复、内容分析等
import { callAIService } from '@/core/lib/api';
import { IMessageAdapter } from "../types/message-service";

// AI 消息助手适配import { IMessageAdapter } from "../types/message-service";

import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

export interface AIMessageAssistantAdapterOptions {
  // 可扩展配置项，如模型类型、API key 等
}

export class AIMessageAssistantAdapter implements IMessageAdapter {
  private options: AIMessageAssistantAdapterOptions;

  constructor(options: AIMessageAssistantAdapterOptions = {}) {
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
  // 可扩展更多 AI 相关方法
}

/**
 * 智能回复
 * @param message 用户输入消息
 * @returns Promise<string> AI 回复内容
 */
async smartReply(message: string): Promise<string> {
  // 调用底层 API 能力
  const result = await callAIService({
    type: 'chat',
    input: message,
    ...this.options
  });
  return result?.reply || '';
}

/**
 * 内容分析
 * @param message 消息内容
 * @returns Promise<any> 分析结果
 */
async analyzeContent(message: string): Promise<any> {
  const result = await callAIService({
    type: 'analyze',
    input: message,
    ...this.options
  });
  return result;
}