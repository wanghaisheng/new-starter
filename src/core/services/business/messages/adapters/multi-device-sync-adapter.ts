// 多端同步消息适配器
// 用于实现消息在多个设备间的同步能力
import { IMessageAdapter } from "../types/message-service";
import { Message, CreateMessageData, UpdateMessageData } from "@/core/lib/db/types/message.types";

export interface MultiDeviceSyncAdapterOptions {
  // 可扩展配置项，如同步策略等
}

export class MultiDeviceSyncAdapter implements IMessageAdapter {
  private options: MultiDeviceSyncAdapterOptions;

  constructor(options: MultiDeviceSyncAdapterOptions = {}) {
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
  // 可扩展多端同步相关方法
  /**
   * 同步消息到所有设备
   * @param userId 用户ID
   * @param message 消息内容
   */
  async syncMessageToDevices(userId: string, message: any): Promise<void> {
    // 这里实现多端同步的具体逻辑
    // 例如调用推送服务、WebSocket 通知等
  }

  /**
   * 获取所有设备的最新消息
   * @param userId 用户ID
   */
  async fetchLatestMessages(userId: string): Promise<any[]> {
    // 这里实现获取多端最新消息的逻辑
    return [];
  }
}
// 仅保留一个 MultiDeviceSyncAdapter 类，实现 IMessageAdapter 接口，避免重复定义。