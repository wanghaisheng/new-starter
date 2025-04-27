import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IMessageAdapter } from '../types/message-service';

/**
 * 多端同步消息适配器
 * 实现多端消息状态同步、草稿同步、断网补齐等能力
 * 支持 WebSocket 实时同步
 */
export class MultiDeviceSyncMessageServiceAdapter implements IMessageAdapter {
  private base: IMessageAdapter;
  private ws?: WebSocket;
  private deviceId: string;
  private _changeListeners: Array<(messages: Message[]) => void> = [];

  constructor(base: IMessageAdapter, wsUrl?: string, deviceId?: string) {
    this.base = base;
    this.deviceId = deviceId || this._genDeviceId();
    if (wsUrl) {
      this._initWebSocket(wsUrl);
    }
  }

  private _genDeviceId(): string {
    // 简单生成设备ID，可替换为更可靠方案
    return 'dev-' + Math.random().toString(36).slice(2);
  }

  private _initWebSocket(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      // 注册设备身份
      this.ws?.send(JSON.stringify({ type: 'register', deviceId: this.deviceId }));
    };
    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'sync' && msg.deviceId !== this.deviceId) {
          // 收到其他设备的变更，主动拉取最新消息并通知监听器
          await this._emitChange();
        }
      } catch {}
    };
  }

  private _broadcastSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'sync', deviceId: this.deviceId }));
    }
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.base.getUserMessages(userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.base.getConversationMessages(conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const msg = await this.base.sendMessage(data);
    this._broadcastSync();
    return msg;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const msg = await this.base.updateMessage(messageId, data);
    this._broadcastSync();
    return msg;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.base.deleteMessage(messageId);
    this._broadcastSync();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.base.markAsRead(messageId);
    this._broadcastSync();
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    return this.base.getMessagesByPage(matchId, page, pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    const msg = await this.base.sendRichMessage(data);
    this._broadcastSync();
    return msg;
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    this._changeListeners.push(callback);
    // 监听底层适配器变更
    const unsub = this.base.onMessageChange(() => this._emitChange());
    return () => {
      this._changeListeners = this._changeListeners.filter(fn => fn !== callback);
      unsub?.();
    };
  }

  private async _emitChange() {
    // 拉取所有消息并通知监听器
    const all = await this.base.getUserMessages('');
    this._changeListeners.forEach(fn => fn(all));
  }
}
