import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';
import { Message } from '@/core/lib/db/types/message';
import { Match } from '@/core/lib/db/types/match';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';
import { IDataService } from '@/core/lib/db/interfaces';

interface UseMessagesResult {
  // 消息相关
  messages: Message[];
  loading: boolean;
  error: Error | null;
  
  // 消息操作
  getMatchMessages: (matchId: string) => Promise<Message[]>;
  sendMessage: (data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'image';
  }) => Promise<Message>;
  markMessagesAsRead: (matchId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // 匹配相关
  getActiveMatches: () => Promise<Match[]>;
  getMatchById: (matchId: string) => Promise<Match | null>;
}

export function useMessages(): UseMessagesResult {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const messageApi = useApi(() => Promise.resolve(messages), {
    offlineFirst: true,
    useHybridClient: true,
    requireAuth: true
  });

  const matchApi = useApi(() => Promise.resolve(matches), {
    offlineFirst: true,
    useHybridClient: true,
    requireAuth: true
  });

  // 获取匹配的消息
  const getMatchMessages = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await messageApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.getMessages(matchId);
    });
    setMessages(result);
    return result;
  }, [messageApi, isAuthenticated]);

  // 发送消息
  const sendMessage = useCallback(async (messageData: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'image';
  }) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await messageApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      const newMessage: Message = {
        id: crypto.randomUUID(),
        matchId: messageData.matchId,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        type: messageData.type || 'text',
        status: 'sent',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return service.createMessage(newMessage);
    });
    setMessages(prev => [...prev, result]);
    return result;
  }, [messageApi, isAuthenticated]);

  // 标记消息为已读
  const markMessagesAsRead = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    await messageApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      const unreadMessages = await service.getUnreadMessages(user?.id || '');
      const matchUnreadMessages = unreadMessages.filter(msg => msg.matchId === matchId);
      await Promise.all(matchUnreadMessages.map((message: Message) => 
        service.updateMessage(message.id, { status: 'read' })
      ));
    });
  }, [messageApi, isAuthenticated, user?.id]);

  // 删除消息
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    await messageApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      await service.deleteMessage(messageId);
    });
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [messageApi, isAuthenticated]);

  // 获取活跃的匹配
  const getActiveMatches = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.getMatches(user.id);
    });
    setMatches(result);
    return result;
  }, [matchApi, isAuthenticated, user?.id]);

  // 获取特定匹配
  const getMatchById = useCallback(async (matchId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const result = await matchApi.execute(async () => {
      const service = DataServiceFactory.getDataService();
      return service.getMatch(matchId);
    });
    return result;
  }, [matchApi, isAuthenticated]);

  // 自动加载活跃匹配
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      getActiveMatches();
    }
  }, [isAuthenticated, user?.id, getActiveMatches]);

  return {
    messages,
    loading: messageApi.loading || matchApi.loading,
    error: messageApi.error || matchApi.error,
    getMatchMessages,
    sendMessage,
    markMessagesAsRead,
    deleteMessage,
    getActiveMatches,
    getMatchById
  };
} 