import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IDataService } from '@/core/services/data/types';
import { IMessageAdapter } from '../types/message-service';

export class MockMessageServiceAdapter implements IMessageAdapter {
  private messages: Message[] = [];
  private _changeListeners: Array<(messages: Message[]) => void> = [];

  constructor(private _dataService?: IDataService) {
    // mock环境暂不依赖dataService
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return this.messages.filter(msg => msg.senderId === userId || msg.receiverId === userId);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return this.messages.filter(msg => msg.matchId === conversationId);
  }

  async getConversationMessages(params: { conversationId: string; page?: number; pageSize?: number }): Promise<Message[]> {
    const all = this.getConversationMessages(params.conversationId);
    if ('page' in params || 'pageSize' in params) {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      return (await all).slice(start, start + pageSize);
    }
    return all;
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const message: Message = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sent',
      type: data.type ?? 'text',
    };
    this.messages.push(message);
    this._emitChange();
    return message;
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('消息不存在');
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
    if (msg) msg.read = true;
    this._emitChange();
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    const all = this.messages.filter(msg => msg.matchId === matchId);
    return all.slice((page - 1) * pageSize, page * pageSize);
  }

  async sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message> {
    return this.sendMessage(data as CreateMessageData);
  }

  onMessageChange(callback: (messages: Message[]) => void): () => void {
    this._changeListeners.push(callback);
    callback(this.messages);
    return () => {
      this._changeListeners = this._changeListeners.filter(fn => fn !== callback);
    };
  }

  private _emitChange() {
    for (const fn of this._changeListeners) fn(this.messages);
  }
}
