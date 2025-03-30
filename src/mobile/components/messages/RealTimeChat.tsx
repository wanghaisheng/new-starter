import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonSpinner } from '@ionic/react';
import { Message } from '@/core/lib/db/models/message';
import { User } from '@/core/lib/db/models/user';
import { MessageService } from '@/core/services/message-service';
import MessageBubble from './MessageBubble';

interface RealTimeChatProps {
  matchId: string;
  currentUserId: string;
  matchedUser: User;
  initialMessages?: Message[];
  onNewMessage?: (message: Message) => void;
}

/**
 * 实时聊天组件
 * 用于显示实时更新的消息列表，并自动滚动到最新消息
 */
const RealTimeChat: React.FC<RealTimeChatProps> = ({
  matchId,
  currentUserId,
  matchedUser,
  initialMessages = [],
  onNewMessage
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const messageService = MessageService.getInstance();
  
  useEffect(() => {
    // 初始化消息
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
      setIsLoading(false);
    } else {
      loadMessages();
    }
    
    // 添加消息监听器，实现实时更新
    const unsubscribe = messageService.addMessageListener(matchId, (updatedMessages) => {
      setMessages(updatedMessages);
      
      // 如果有新消息回调，通知父组件
      if (onNewMessage && updatedMessages.length > messages.length) {
        const newMessages = updatedMessages.slice(messages.length);
        newMessages.forEach(msg => onNewMessage(msg));
      }
      
      // 标记接收到的消息为已读
      markReceivedMessagesAsRead(updatedMessages);
    });
    
    // 组件卸载时清理监听器
    return () => {
      unsubscribe();
    };
  }, [matchId, currentUserId]);
  
  // 当消息更新时，滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * 加载消息历史
   */
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const chatMessages = await messageService.getMessages(matchId);
      setMessages(chatMessages);
      
      // 标记接收到的消息为已读
      markReceivedMessagesAsRead(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * 标记接收到的消息为已读
   */
  const markReceivedMessagesAsRead = async (messageList: Message[]) => {
    try {
      // 找出所有发送给当前用户且未读的消息
      const unreadMessages = messageList.filter(
        msg => msg.receiverId === currentUserId && !msg.isRead
      );
      
      if (unreadMessages.length > 0) {
        // 标记所有未读消息为已读
        await messageService.markAllMessagesAsRead(matchId, currentUserId);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  /**
   * 滚动到最新消息
   */
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  };
  
  return (
    <IonContent ref={contentRef} className="ion-padding">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <IonSpinner name="dots" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <p>还没有消息</p>
          <p className="text-sm mt-2">发送第一条消息开始聊天吧！</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 pb-4">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUserId}
            />
          ))}
        </div>
      )}
    </IonContent>
  );
};

export default RealTimeChat;