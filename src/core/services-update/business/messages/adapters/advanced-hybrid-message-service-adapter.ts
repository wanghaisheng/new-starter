import { IMessageService } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { AdvancedHybridDatabaseClient } from '@/core/services-update/data/adapters/advanced-hybrid-database-client';

/**
 * 高级 hybrid 消息服务适配器
 * 支持多级缓存、离线队列、自动同步、同步进度事件、消息监听
 */
export class AdvancedHybridMessageServiceAdapter implements IMessageService {
  private db: AdvancedHybridDatabaseClient;

  constructor(db?: AdvancedHybridDatabaseClient) {
    // 可注入或自动创建
    this.db = db || new AdvancedHybridDatabaseClient({ onlineType: 'supabase', entityTypes: ['messages'] });
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    // 假设 messages 集合有 senderId/receiverId 字段
    const all = await this.db.query<Message>('messages', {
      $or: [{ senderId: userId }, { receiverId: userId }]
    });
    return all;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.db.query<Message>('messages', { conversationId });
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const now = new Date();
    const msg: Message = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      status: 'sent',
    };
    await this.db.insert<Message>('messages', msg);
    return msg;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const updated = await this.db.update<Message>('messages', messageId, { ...data, updatedAt: new Date() });
    if (!updated) throw new Error('Message not found');
    return updated;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.db.delete('messages', messageId);
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.db.update<Message>('messages', messageId, { status: 'read', updatedAt: new Date() });
  }

  /**
   * 分页获取指定会话的消息（接口兼容 IMessageService）
   */
  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    // 兼容 conversationId 与 matchId
    return this.db.query<Message>('messages', { matchId }, {
      skip: page * pageSize,
      limit: pageSize,
      sort: { createdAt: -1 }
    });
  }

  /**
   * 发送富媒体消息（接口兼容 IMessageService）
   */
  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    const now = new Date();
    const msg: Message = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      status: 'sent',
    };
    await this.db.insert<Message>('messages', msg);
    return msg;
  }

  /**
   * 监听消息变更，返回解绑函数（接口兼容 IMessageService）
   */
  onMessageChange(callback: (msgs: Message[]) => void): () => void {
    const handler = (col: string, docs: any[]) => {
      if (col === 'messages') callback(docs as Message[]);
    };
    this.db.on('change', handler);
    // 返回解绑函数
    return () => this.db.off && this.db.off('change', handler);
  }

  /**
   * 监听同步进度
   */
  onSyncProgress(callback: (progress: any) => void) {
    this.db.on('syncProgress', callback);
  }

  /**
   * 监听网络状态变化
   */
  onNetworkStatusChange(callback: (status: { connected: boolean }) => void) {
    if (this.db['networkManager'] && typeof this.db['networkManager'].on === 'function') {
      this.db['networkManager'].on('status', callback);
    }
  }

  /**
   * 批量标记已读
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markAsRead(id)));
  }

  /**
   * 批量删除消息
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.deleteMessage(id)));
  }

  /**
   * 撤回消息（软删除）
   */
  async recallMessage(messageId: string): Promise<void> {
    // 这里只做软删除，实际可自定义
    await this.db.update<Message>('messages', messageId, { status: 'recalled', updatedAt: new Date() });
  }

  /**
   * 监听消息撤回
   */
  onMessageRecall(callback: (msg: Message) => void) {
    this.db.on('change', (col: string, docs: any[]) => {
      if (col === 'messages') {
        docs.forEach(m => {
          if (m.status === 'recalled') callback(m as Message);
        });
      }
    });
  }

  /**
   * 监听同步完成事件
   */
  onSyncComplete(callback: () => void) {
    this.db.on('syncProgress', (progress: any) => {
      if (progress.percent === 100) callback();
    });
  }
}
