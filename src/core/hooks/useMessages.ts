import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageServiceRegistry } from '@/core/services/business/messages/registry/message-service-registry';
import type { Message } from '@/core/lib/db/types/message';
import type { CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message';
import type { IMessageService } from '@/core/services/business/messages/types/message-service';
import { useToast } from './useToast';

export interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  fetchMessages: (page?: number, pageSize?: number) => Promise<void>;
  sendMessage: (data: CreateMessageData) => Promise<Message>;
  updateMessage: (messageId: string, data: UpdateMessageData) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  reloadMessages: () => Promise<void>;
}

export function useMessages(conversationId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const serviceRef = useRef<IMessageService | null>(null);
  const pageRef = useRef<number>(1);
  const pageSizeRef = useRef<number>(20);

  useEffect(() => {
    // 统一通过 Registry 获取服务实例，参数类型安全
    const allowedTypes = ['mock', 'remote', 'hybrid', 'advanced-hybrid'] as const;
    type MessageServiceType = typeof allowedTypes[number];
    const envType = process.env.NEXT_PUBLIC_MESSAGE_SERVICE_TYPE;
    const type: MessageServiceType = allowedTypes.includes(envType as MessageServiceType)
      ? (envType as MessageServiceType)
      : (process.env.NODE_ENV === 'development' ? 'mock' : 'remote');
    const provider = MessageServiceRegistry.getInstance().getProvider(type, 'default');
    serviceRef.current = provider ? provider() : null;
  }, []);

  // 事件回调 useCallback 保证引用稳定
  const handleMessageEvent = useCallback((data: { type: string; payload?: any }) => {
    switch (data.type) {
      case 'update':
        setMessages(Array.isArray(data.payload?.messages) ? data.payload.messages : []);
        setEmpty(!data.payload?.messages?.length);
        break;
      case 'error': {
        const err = data.payload?.error;
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError({ type: 'fetch', message: errorObj.message });
        setMessages([]);
        setEmpty(true);
        triggerToast(errorObj.message);
        break;
      }
      default:
        break;
    }
  }, [triggerToast]);

  const fetchMessages = useCallback(async (page?: number, pageSize?: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const msgs = await serviceRef.current.getMessages(conversationId, page || pageRef.current, pageSize || pageSizeRef.current);
      setMessages(msgs);
      setEmpty(msgs.length === 0);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取消息失败' });
      setMessages([]);
      setEmpty(true);
      triggerToast(err?.message || '获取消息失败');
    } finally {
      setLoading(false);
    }
  }, [conversationId, triggerToast]);

  const sendMessage = useCallback(async (data: CreateMessageData) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const msg = await serviceRef.current.createMessage({ ...data, conversationId });
      await fetchMessages();
      return msg;
    } catch (err: any) {
      setError({ type: 'send', message: err?.message || '发送消息失败' });
      triggerToast(err?.message || '发送消息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, triggerToast, conversationId]);

  const updateMessage = useCallback(async (messageId: string, data: UpdateMessageData) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const msg = await serviceRef.current.updateMessage(messageId, data);
      await fetchMessages();
      return msg;
    } catch (err: any) {
      setError({ type: 'update', message: err?.message || '更新消息失败' });
      triggerToast(err?.message || '更新消息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, triggerToast]);

  const deleteMessage = useCallback(async (messageId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      await serviceRef.current.deleteMessage(messageId);
      await fetchMessages();
    } catch (err: any) {
      setError({ type: 'delete', message: err?.message || '删除消息失败' });
      triggerToast(err?.message || '删除消息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, triggerToast]);

  const reloadMessages = fetchMessages;

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    empty,
    fetchMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    reloadMessages,
  };
}
