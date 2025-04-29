import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, CreateMessageData, UpdateMessageData } from '@/core/lib/db/types/message.types';
import { useToast } from './useToast';
import { useService } from '@/src/providers/ServiceProvider';

export interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: null | { type: string; message: string };
  empty: boolean;
  fetchMessages: (params?: { page?: number; pageSize?: number }) => Promise<void>;
  sendMessage: (data: CreateMessageData) => Promise<Message>;
  updateMessage: (messageId: string, data: UpdateMessageData) => Promise<Message>;
  deleteMessage: (messageId: string) => Promise<void>;
  reloadMessages: () => Promise<void>;
  fetchError?: { message: string } | null;
  sendError?: { message: string } | null;
}

export function useMessages(conversationId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const pageRef = useRef<number>(1);
  const pageSizeRef = useRef<number>(20);
  const { userService } = useService(); 
  const messageService = userService.getMessageService?.(); 

  useEffect(() => {
    messageService?.getConversationMessages({
      conversationId,
      page: pageRef.current,
      pageSize: pageSizeRef.current,
    }).then(msgs => {
      setMessages(msgs);
      setEmpty(msgs.length === 0);
    }).catch(err => {
      setError({ type: 'fetch', message: err?.message || '获取消息失败' });
      setMessages([]);
      setEmpty(true);
      triggerToast(err?.message || '获取消息失败');
    }).finally(() => {
      setLoading(false);
    });
  }, [messageService, conversationId, triggerToast]);

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

  const fetchMessages = useCallback(async (params?: { page?: number; pageSize?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const msgs = await messageService?.getConversationMessages({
        conversationId,
        page: params?.page || pageRef.current,
        pageSize: params?.pageSize || pageSizeRef.current,
      });
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
  }, [messageService, conversationId, triggerToast]);

  const sendMessage = useCallback(async (data: CreateMessageData) => {
    setLoading(true);
    setError(null);
    try {
      const msg = await messageService?.sendMessage({ ...data, conversationId });
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
      const msg = await messageService?.updateMessage(messageId, data);
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
      await messageService?.deleteMessage(messageId);
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
    fetchError: error?.type === 'fetch' ? error : null,
    sendError: error?.type === 'send' ? error : null,
  };
}
