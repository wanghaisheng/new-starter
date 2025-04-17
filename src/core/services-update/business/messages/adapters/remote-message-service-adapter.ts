import { IMessageService } from '../types/message-service';
import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';

export class RemoteMessageServiceAdapter implements IMessageService {
  async getUserMessages(userId: string): Promise<Message[]> {
    // 远程API调用示例
    const resp = await fetch(`/api/message/user/${userId}`);
    if (!resp.ok) throw new Error('Failed to fetch user messages');
    return resp.json();
  }
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const resp = await fetch(`/api/message/conversation/${conversationId}`);
    if (!resp.ok) throw new Error('Failed to fetch conversation messages');
    return resp.json();
  }
  async sendMessage(data: CreateMessageData): Promise<Message> {
    const resp = await fetch(`/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Failed to send message');
    return resp.json();
  }
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message> {
    const resp = await fetch(`/api/message/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Failed to update message');
    return resp.json();
  }
  async deleteMessage(messageId: string): Promise<void> {
    const resp = await fetch(`/api/message/${messageId}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to delete message');
  }
  async markAsRead(messageId: string): Promise<void> {
    const resp = await fetch(`/api/message/${messageId}/read`, { method: 'POST' });
    if (!resp.ok) throw new Error('Failed to mark as read');
  }

  /** 分页获取指定会话的消息 */
  async getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    const resp = await fetch(`/api/message/conversation/${matchId}?page=${page}&pageSize=${pageSize}`);
    if (!resp.ok) throw new Error('Failed to fetch paged messages');
    return resp.json();
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
    const resp = await fetch(`/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Failed to send rich message');
    return resp.json();
  }

  /** 监听消息变更，返回解绑函数（WebSocket/SSE 实现） */
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    // 假设后端已实现 /api/message/subscribe SSE 或 ws(s):// 订阅接口
    let eventSource: EventSource | null = null;
    let ws: WebSocket | null = null;
    // 优先用 WebSocket，若不可用则回退 SSE
    try {
      ws = new WebSocket('wss://your-api-domain/ws/messages'); // TODO: 替换为实际 ws 地址
      ws.onmessage = (event) => {
        try {
          const msgs = JSON.parse(event.data) as Message[];
          callback(msgs);
        } catch {}
      };
      ws.onerror = () => {
        ws?.close();
      };
      // 返回解绑函数
      return () => { ws?.close(); };
    } catch {
      // WebSocket 不可用时回退 SSE
      eventSource = new EventSource('/api/message/subscribe');
      eventSource.onmessage = (event) => {
        try {
          const msgs = JSON.parse(event.data) as Message[];
          callback(msgs);
        } catch {}
      };
      // 返回解绑函数
      return () => { eventSource?.close(); };
    }
  }

  /** 批量标记消息为已读 */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.markAsRead(id)));
  }

  /** 批量删除消息 */
  async deleteMessages(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => this.deleteMessage(id)));
  }

  /** 撤回消息（软删除） */
  async recallMessage(messageId: string): Promise<void> {
    const resp = await fetch(`/api/message/${messageId}/recall`, { method: 'POST' });
    if (!resp.ok) throw new Error('Failed to recall message');
  }

  /** 监听消息撤回事件（WebSocket/SSE） */
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

  /** 监听同步进度事件（WebSocket/SSE） */
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
