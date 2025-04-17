import { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import { User } from '@/core/lib/db/types/user';

export interface IMessageService {
  /** 获取用户所有相关消息（如会话列表） */
  getUserMessages(userId: string): Promise<Message[]>;
  /** 获取指定会话的所有消息 */
  getConversationMessages(conversationId: string): Promise<Message[]>;
  /** 发送基础消息 */
  sendMessage(data: CreateMessageData): Promise<Message>;
  /** 更新消息内容或状态 */
  updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  /** 删除消息 */
  deleteMessage(messageId: string): Promise<void>;
  /** 标记消息为已读 */
  markAsRead(messageId: string): Promise<void>;

  /** 分页获取指定会话的消息 */
  getMessagesByPage(matchId: string, page: number, pageSize: number): Promise<Message[]>;
  /** 发送富媒体消息 */
  sendRichMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image';
    mediaUrl?: string;
  }): Promise<Message>;
  /** 监听消息变更，返回解绑函数 */
  onMessageChange(callback: (messages: Message[]) => void): () => void;
}
