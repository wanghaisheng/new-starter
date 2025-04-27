import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IMessageAdapter } from '../types/message-service';

/**
 * HybridMessageServiceAdapter
 * 本地优先，远程兜底，写操作本地优先、远程同步。
 * 只做数据聚合/同步/过滤，不做复杂业务逻辑。
 */
export class HybridMessageServiceAdapter implements IMessageAdapter {
  private local: IMessageAdapter;
  private remote: IMessageAdapter;
  private _changeListeners: Array<(messages: Message[]) => void> = [];
  private _localUnsub?: () => void;
  private _remoteUnsub?: () => void;

  constructor(local: IMessageAdapter, remote: IMessageAdapter) {
    this.local = local;
    this.remote = remote;
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const localMsgs = await this.local.getUserMessages(userId);
    if (localMsgs.length > 0) return localMsgs;
    return this.remote.getUserMessages(userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const localMsgs = await this.local.getConversationMessages(conversationId);
    if (localMsgs.length > 0) return localMsgs;
    return this.remote.getConversationMessages(conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const msg = await this.local.sendMessage(data);
    this.remote.sendMessage(data).catch(() => {});
    await this._emitChange();
    return msg;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const msg = await this.local.updateMessage(messageId, data);
    this.remote.updateMessage(messageId, data).catch(() => {});
    await this._emitChange();
    return msg;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.local.deleteMessage(messageId);
    this.remote.deleteMessage(messageId).catch(() => {});
    await this._emitChange();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.local.markAsRead(messageId);
    this.remote.markAsRead(messageId).catch(() => {});
    await this._emitChange();
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    const localMsgs = await this.local.getMessagesByPage(matchId, page, pageSize);
    if (localMsgs.length > 0) return localMsgs;
    return this.remote.getMessagesByPage(matchId, page, pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    const msg = await this.local.sendRichMessage(data);
    this.remote.sendRichMessage(data).catch(() => {});
    await this._emitChange();
    return msg;
  }

  /**
   * 监听消息变更，聚合本地/远程监听，返回解绑函数
   */
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    this._changeListeners.push(callback);
    // 只监听本地，远程数据变更一般会同步到本地
    if (!this._localUnsub) {
      this._localUnsub = this.local.onMessageChange((msgs) => this._emitChange());
    }
    // 可选监听远程（如远程有推送能力）
    if (!this._remoteUnsub && typeof this.remote.onMessageChange === 'function') {
      this._remoteUnsub = this.remote.onMessageChange((msgs) => this._emitChange());
    }
    return () => {
      this._changeListeners = this._changeListeners.filter(fn => fn !== callback);
      if (this._changeListeners.length === 0) {
        this._localUnsub?.();
        this._remoteUnsub?.();
        this._localUnsub = undefined;
        this._remoteUnsub = undefined;
      }
    };
  }

  /**
   * 内部方法：聚合本地消息并通知监听器
   */
  private async _emitChange() {
    const all = await this.local.getUserMessages(''); // '' 表示获取所有消息，具体实现可调整
    this._changeListeners.forEach(fn => fn(all));
  }

  /**
   * 批量标记已读
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markAsRead(id)));
    await this._emitChange();
  }

  /**
   * 批量删除消息
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.deleteMessage(id)));
    await this._emitChange();
  }

  /**
   * 撤回消息（软删除，status 字段兼容类型处理）
   */
  async recallMessage(messageId: string): Promise<void> {
    if (typeof this.local.recallMessage === 'function') {
      await this.local.recallMessage(messageId);
    }
    if (typeof this.remote.recallMessage === 'function') {
      this.remote.recallMessage(messageId).catch(() => {});
    }
    await this._emitChange();
  }
}
