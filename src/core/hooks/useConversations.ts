import { useState, useEffect, useCallback, useRef } from 'react';
import { useMessageService } from '@/providers/ServiceProvider';
import type { Message } from '@/core/lib/db/types/message.types';
import { useToast } from './useToast';

// 消息/会话服务接口类型定义
export interface IConversationService {
  getUserMessages(uid: string): Promise<Message[]>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  markAsRead(messageId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  // 可扩展更多会话属性
}

/**
 * error 字段结构统一为 { type: string; message: string } | null
 */
export interface UseConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  fetchError: { type: string; message: string } | null;
  markError: { type: string; message: string } | null;
  deleteError: { type: string; message: string } | null;
  fetchConversations: (userId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
}

export function useConversations(userId: string): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{ type: string; message: string } | null>(null);
  const [markError, setMarkError] = useState<{ type: string; message: string } | null>(null);
  const [deleteError, setDeleteError] = useState<{ type: string; message: string } | null>(null);
  const { triggerToast } = useToast();
  // 类型约束：MessageService 类型
  const serviceRef = useRef<IConversationService | null>(null);

  useEffect(() => {
    // 使用ServiceProvider提供的钩子获取服务实例
    const messageService = useMessageService();
    // 将服务实例保存到ref中
    serviceRef.current = messageService;
    if (userId) fetchConversations(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchConversations = useCallback(async (uid: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      // 假设 getUserMessages 返回所有会话的最后一条消息
      const messages: Message[] = (await serviceRef.current?.getUserMessages(uid)) || [];
      // 简单聚合为会话列表（实际可根据业务调整）
      const convMap = new Map<string, Conversation>();
      for (const msg of messages) {
        const cid = msg.conversationId;
        if (!convMap.has(cid)) {
          convMap.set(cid, {
            id: cid,
            participants: [msg.senderId, msg.receiverId],
            lastMessage: msg,
            unreadCount: msg.status !== 'read' ? 1 : 0,
          });
        } else {
          const conv = convMap.get(cid)!;
          if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
            conv.lastMessage = msg;
          }
          if (msg.status !== 'read') conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      }
      setConversations(Array.from(convMap.values()));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取会话失败');
      setFetchError({ type: 'fetch', message: error.message });
      triggerToast(error.message);
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    try {
      // 获取该会话所有消息并标记为已读
      const msgs: Message[] = (await serviceRef.current?.getConversationMessages(conversationId)) || [];
      await Promise.all(msgs.map(m => serviceRef.current?.markAsRead(m.id)));
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('标记会话已读失败');
      setMarkError({ type: 'mark', message: error.message });
      triggerToast(error.message);
      throw error;
    }
  }, [triggerToast]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      // 获取该会话所有消息并删除
      const msgs: Message[] = (await serviceRef.current?.getConversationMessages(conversationId)) || [];
      await Promise.all(msgs.map(m => serviceRef.current?.deleteMessage(m.id)));
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      triggerToast('会话已删除');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('删除会话失败');
      setDeleteError({ type: 'delete', message: error.message });
      triggerToast(error.message);
      throw error;
    }
  }, [triggerToast]);

  return {
    conversations,
    loading,
    fetchError,
    markError,
    deleteError,
    fetchConversations,
    markConversationRead,
    deleteConversation,
  };
}
