import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IDataService } from '@/core/services/data/types';
import { IMessageAdapter } from '../types/message-service';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import type { NetworkStatus } from '@/core/services/infrastructure/network/network-manager';

/**
 * 高级 hybrid 消息服务适配器
 * 依赖统一的数据服务（IDataService），支持多级缓存、离线队列、自动同步、消息监听
 * 只做数据聚合/同步/过滤，不做内容审核、AI排序等复杂算法
 */
export class AdvancedHybridMessageServiceAdapter implements IMessageAdapter {
  private dataService?: IDataService;
  private _changeListeners: Array<(messages: Message[]) => void> = [];

  constructor(dataService?: IDataService) {
    this.dataService = dataService;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    return this.dataService.query<Message>('messages', {
      $or: [{ senderId: userId }, { receiverId: userId }]
    });
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    return this.dataService.query<Message>('messages', { conversationId });
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    const now = new Date();
    const msg: Message = {
      id: crypto.randomUUID(),
      ...data,
      type: data.type ?? 'text',
      createdAt: now,
      updatedAt: now,
      status: 'sent',
    };
    const result = await this.dataService.insert<Message>('messages', msg);
    await this._emitChange();
    return result;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    const updated = await this.dataService.update<Message>('messages', messageId, { ...data, updatedAt: new Date() });
    if (!updated) throw new Error('Message not found');
    await this._emitChange();
    return updated;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    await this.dataService.delete('messages', messageId);
    await this._emitChange();
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    await this.dataService.update<Message>('messages', messageId, { status: 'read', updatedAt: new Date() });
    await this._emitChange();
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    const msgs = await this.dataService.query<Message>('messages', { matchId });
    // 按 createdAt 降序，分页
    return msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(page * pageSize, (page + 1) * pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    const now = new Date();
    const msg: Message = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      status: 'sent',
    };
    const result = await this.dataService.insert<Message>('messages', msg);
    await this._emitChange();
    return result;
  }

  /**
   * 监听消息变更，返回解绑函数
   */
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    this._changeListeners.push(callback);
    // 如 dataService 支持事件，可在此注册
    if (typeof this.dataService.on === 'function') {
      this.dataService.on('messagesChange', async () => {
        const all = await this.dataService.query<Message>('messages', {});
        callback(all);
      });
    }
    return () => {
      this._changeListeners = this._changeListeners.filter(fn => fn !== callback);
    };
  }

  /**
   * 内部方法：触发消息变更事件
   */
  private async _emitChange() {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    const all = await this.dataService.query<Message>('messages', {});
    this._changeListeners.forEach(fn => fn(all));
  }

  /**
   * 监听同步进度
   */
  onSyncProgress(callback: (progress: any) => void) {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    if (typeof this.dataService.on === 'function') {
      this.dataService.on('syncProgress', callback);
    }
  }

  /**
   * 监听网络状态变化（多状态支持）
   */
  onNetworkStatusChange(callback: (status: { connected: boolean; raw: NetworkStatus }) => void) {
    const networkManager = getNetworkManager();
    networkManager.onStatusChange((status: NetworkStatus) => {
      callback({ connected: status === 'online' || status === 'limited' || status === 'slow', raw: status });
    });
  }

  /**
   * 批量标记已读
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    await Promise.all(messageIds.map(id => this.markAsRead(id)));
    await this._emitChange();
  }

  /**
   * 批量删除消息
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    await Promise.all(messageIds.map(id => this.deleteMessage(id)));
    await this._emitChange();
  }

  /**
   * 撤回消息（软删除，status 字段兼容类型处理）
   */
  async recallMessage(messageId: string): Promise<void> {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    await this.dataService.update<Message>('messages', messageId, { status: 'recalled' as any, updatedAt: new Date() });
    await this._emitChange();
  }

  /**
   * 监听消息撤回
   */
  onMessageRecall(callback: (msg: Message) => void) {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    if (typeof this.dataService.on === 'function') {
      this.dataService.on('change', (col: string, docs: any[]) => {
        if (col === 'messages') {
          docs.forEach(m => {
            if (m.status === 'recalled') callback(m as Message);
          });
        }
      });
    }
  }

  /**
   * 监听同步完成事件
   */
  onSyncComplete(callback: () => void) {
    if (!this.dataService) throw new Error('AdvancedHybridMessageServiceAdapter: dataService 未注入');
    if (typeof this.dataService.on === 'function') {
      this.dataService.on('syncProgress', (progress: any) => {
        if (progress.percent === 100) callback();
      });
    }
  }
}
