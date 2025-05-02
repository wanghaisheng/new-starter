// 消息适配器基础类与接口实现
import type { IMessageAdapter } from '../../types/message-service';
import type { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message.types';

export abstract class MessageAdapterBase implements IMessageAdapter {
  abstract getUserMessages(userId: string): Promise<Message[]>;
  abstract getConversationMessages(conversationId: string): Promise<Message[]>;
  abstract getMessagesByPage(conversationId: string, page: number, pageSize: number): Promise<Message[]>;
  abstract sendMessage(data: CreateMessageData): Promise<Message>;
  abstract updateMessage(messageId: string, data: UpdateMessageData): Promise<Message>;
  abstract deleteMessage(messageId: string): Promise<void>;
  abstract markAsRead(messageId: string): Promise<void>;
  onMessageChange(callback: (messages: Message[]) => void): () => void {
    throw new Error('onMessageChange 未实现');
  }
  sendRichMessage?(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: Message["type"];
    mediaUrl?: string;
    ext?: Record<string, any>;
  }): Promise<Message> {
    throw new Error('sendRichMessage 未实现');
  }
}