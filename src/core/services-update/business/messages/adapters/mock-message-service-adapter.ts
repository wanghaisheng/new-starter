import { IMessageService } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';

export class MockMessageServiceAdapter implements IMessageService {
  private messages: Message[] = [];

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.messages.filter(msg => msg.senderId === userId || msg.receiverId === userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    // 兼容 mock 类型，假设 conversationId === matchId
    return this.messages.filter(msg => msg.matchId === conversationId);
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      ...data,
      type: data.type ?? 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sent',
    };
    this.messages.push(message);
    this._emitChange();
    return message;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');
    this.messages[idx] = { ...this.messages[idx], ...data, updatedAt: new Date() };
    this._emitChange();
    return this.messages[idx];
  }

  async deleteMessage(messageId: string): Promise<void> {
    this.messages = this.messages.filter(m => m.id !== messageId);
    this._emitChange();
  }

  async markAsRead(messageId: string): Promise<void> {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) msg.status = 'read';
    this._emitChange();
  }

  /** 分页获取指定会话的消息 */
  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    const msgs = this.messages.filter(m => m.matchId === matchId);
    return msgs.slice(page * pageSize, (page + 1) * pageSize);
  }

  /** 发送富媒体消息 */
  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      ...data,
      type: data.type ?? 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sent',
    };
    this.messages.push(message);
    // 触发消息变更监听
    this._emitChange();
    return message;
  }

  /** 监听消息变更，返回解绑函数 */
  private _changeListeners: Array<(messages: Message[]) => void> = [];
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    this._changeListeners.push(callback);
    // 立即推送一次
    callback(this.messages);
    // 返回解绑函数
    return () => {
      this._changeListeners = this._changeListeners.filter(fn => fn !== callback);
    };
  }
  private _emitChange() {
    for (const fn of this._changeListeners) fn(this.messages);
  }
}
