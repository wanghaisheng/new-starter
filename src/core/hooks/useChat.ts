import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { Chat, Message } from '@/core/lib/db/types';

interface UseChatResult {
  chats: Chat[];
  messages: Message[];
  loading: boolean;
  error: Error | null;
  getUserChats: (userId: string) => Promise<Chat[]>;
  getMatchMessages: (matchId: string) => Promise<Message[]>;
  sendMessage: (data: {
    matchId: string;
    senderId: string;
    content: string;
    type?: string;
  }) => Promise<Message>;
}

export function useChat(): UseChatResult {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const { loading: loadingChats, error: chatsError, execute: fetchChats } = useApi<Chat[]>(
    async (userId: string) => {
      const response = await fetch(`/api/mobile/v1/chats?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      return data.data;
    }
  );

  const { loading: loadingMessages, error: messagesError, execute: fetchMessages } = useApi<Message[]>(
    async (matchId: string) => {
      const response = await fetch(`/api/mobile/v1/chats?matchId=${matchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      return data.data;
    }
  );

  const { loading: sendingMessage, execute: executeSendMessage } = useApi<Message>(
    async (messageData: {
      matchId: string;
      senderId: string;
      content: string;
      type?: string;
    }) => {
      const response = await fetch('/api/mobile/v1/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      const data = await response.json();
      return data.data;
    }
  );

  const getUserChats = useCallback(async (userId: string) => {
    const fetchedChats = await fetchChats(userId);
    setChats(fetchedChats);
    return fetchedChats;
  }, [fetchChats]);

  const getMatchMessages = useCallback(async (matchId: string) => {
    const fetchedMessages = await fetchMessages(matchId);
    setMessages(fetchedMessages);
    return fetchedMessages;
  }, [fetchMessages]);

  const sendMessage = useCallback(async (messageData: {
    matchId: string;
    senderId: string;
    content: string;
    type?: string;
  }) => {
    const newMessage = await executeSendMessage(messageData);
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [executeSendMessage]);

  return {
    chats,
    messages,
    loading: loadingChats || loadingMessages || sendingMessage,
    error: chatsError || messagesError,
    getUserChats,
    getMatchMessages,
    sendMessage,
  };
} 