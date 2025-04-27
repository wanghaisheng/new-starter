import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { IDataService } from '@/core/services/data/types';
import { IMessageAdapter } from '../types/message-service';

export class RemoteMessageServiceAdapter implements IMessageAdapter {
  private _dataService?: IDataService;
  private apiBaseUrl: string;

  constructor(dataService?: IDataService, apiBaseUrl?: string) {
    this._dataService = dataService;
    this.apiBaseUrl = apiBaseUrl || '';
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/user/${userId}`);
    if (!resp.ok) throw new Error('Failed to fetch user messages');
    return resp.json();
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/conversation/${conversationId}`);
    if (!resp.ok) throw new Error('Failed to fetch conversation messages');
    return resp.json();
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error('Failed to send message');
    return resp.json();
  }

  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error('Failed to update message');
    return resp.json();
  }

  async deleteMessage(messageId: string): Promise<void> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/${messageId}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to delete message');
  }

  async markAsRead(messageId: string): Promise<void> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/${messageId}/read`, { method: 'POST' });
    if (!resp.ok) throw new Error('Failed to mark as read');
  }

  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/page?matchId=${matchId}&page=${page}&pageSize=${pageSize}`);
    if (!resp.ok) throw new Error('Failed to fetch messages by page');
    return resp.json();
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
    // 实际项目可用 WebSocket/SSE 实现
    return () => {};
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markAsRead(id)));
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.deleteMessage(id)));
  }

  async recallMessage(messageId: string): Promise<void> {
    const resp = await fetch(`${this.apiBaseUrl}/api/message/${messageId}/recall`, { method: 'POST' });
    if (!resp.ok) throw new Error('Failed to recall message');
  }

  onMessageRecall(callback: (msg: Message) => void): () => void {
    // 复用 WebSocket/SSE 连接，实际项目建议统一复用连接
    let ws: WebSocket | null = null;
    let eventSource: EventSource | null = null;
    try {
      ws = new WebSocket('wss://your-api-domain/ws/messages/recall');
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as Message;
          callback(msg);
        } catch {}
      };
      ws.onerror = () => { ws?.close(); };
      return () => { ws?.close(); };
    } catch {
      eventSource = new EventSource('/api/message/subscribe/recall');
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as Message;
          callback(msg);
        } catch {}
      };
      return () => { eventSource?.close(); };
    }
  }

  onSyncProgress(callback: (progress: any) => void): () => void {
    let ws: WebSocket | null = null;
    let eventSource: EventSource | null = null;
    try {
      ws = new WebSocket('wss://your-api-domain/ws/messages/sync');
      ws.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          callback(progress);
        } catch {}
      };
      ws.onerror = () => { ws?.close(); };
      return () => { ws?.close(); };
    } catch {
      eventSource = new EventSource('/api/message/subscribe/sync');
      eventSource.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          callback(progress);
        } catch {}
      };
      return () => { eventSource?.close(); };
    }
  }
}
