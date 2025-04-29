// 新一代消息服务核心实现（增强器链式聚合，支持多种消息类型与能力注入）
import type {
  IMessageService,
  IMessageEnhancer,
} from '../types/message-service';
import type { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message.types';
import type { IMessageRepository } from '@/core/lib/db/repositories/impl/message-repository';

/**
 * 消息服务支持的配置能力
 */
export interface MessageServiceConfig {
  /**
   * 支持的消息类型（如 'text', 'text-image', 'text-image-video'）
   */
  messageType: string;
  /**
   * 开启的增强特性（如 ['ai', 'audit', 'contentSafety']）
   */
  features?: string[];
  /**
   * 其他业务相关配置
   */
  [key: string]: any;
}

export class MessageService implements IMessageService {
  private repository: IMessageRepository;
  private enhancers: IMessageEnhancer[];
  private config: MessageServiceConfig;
  private configService: any;

  /**
   * @param configService 配置服务（用于获取支持的消息类型、增强器等）
   * @param repositoryMap 仓储工厂表（key: messageType, value: 仓储实例）
   * @param enhancerMap enhancer 工厂表（key: enhancer type, value: 工厂函数）
   */
  constructor(
    configService: any,
    repositoryMap: Record<string, IMessageRepository>,
    enhancerMap: Record<string, () => IMessageEnhancer>,
  ) {
    this.configService = configService;
    // 从 configService 获取类型和特性
    const messageType = configService.get('NEXT_PUBLIC_MESSAGE_TYPE') || 'text';
    const enhancerList: string[] = configService.get('NEXT_PUBLIC_MESSAGE_FEATURES')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    this.config = { messageType, features: enhancerList };
    // 动态选择仓储
    this.repository = repositoryMap[messageType] || repositoryMap['text'];
    // 动态生成增强器链
    this.enhancers = enhancerList.map(key => enhancerMap[key]?.()).filter(Boolean);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    // 可根据 config/settingService 做能力控制
    return this.repository.getMessages(userId);
  }

  async getConversationMessages(params: { conversationId: string; page?: number; pageSize?: number }): Promise<Message[]> {
    // 可根据 config/settingService 做能力控制
    return this.repository.getMessages(params.conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    let enhancedData = data;
    for (const enhancer of this.enhancers) {
      if (enhancer.beforeSend) {
        enhancedData = await enhancer.beforeSend(enhancedData);
      }
    }
    let msg = await this.repository.saveMessage(enhancedData);
    for (const enhancer of this.enhancers) {
      if (enhancer.afterSend) {
        msg = await enhancer.afterSend(msg);
      }
    }
    return msg;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (!this.repository.updateMessage) {
      throw new Error('当前消息仓储未实现 updateMessage');
    }
    return this.repository.updateMessage(messageId, data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.repository.deleteMessage) {
      throw new Error('当前消息仓储未实现 deleteMessage');
    }
    return this.repository.deleteMessage(messageId);
  }

  async markAsRead(messageId: string): Promise<void> {
    // return this.repository.markAsRead(messageId);
    throw new Error('Not implemented');
  }

  async getMessagesByPage(conversationId: string, page: number, pageSize: number): Promise<Message[]> {
    throw new Error('getMessagesByPage 未实现');
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    throw new Error('onMessageChange 未实现');
  }
}
