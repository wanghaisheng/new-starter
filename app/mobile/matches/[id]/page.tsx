'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonFooter, IonItem, IonInput, IonButton, IonIcon, IonAvatar, IonLabel } from '@ionic/react';
import { send } from 'ionicons/icons';
import { useParams } from 'next/navigation';
import { Match, Message, User } from '@/core/models/user';
import { mockMatches } from '@/core/lib/db/mock/matches';
import { mockUsers } from '@/core/lib/db/mock/users';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const contentRef = useRef<HTMLIonContentElement>(null);
  
  // 当前用户ID（在实际应用中会从认证服务获取）
  const currentUserId = '1';
  
  useEffect(() => {
    // 获取匹配信息
    const foundMatch = mockMatches.find(m => m.id === matchId);
    if (foundMatch) {
      setMatch(foundMatch);
      
      // 获取匹配的用户信息
      const otherUserId = foundMatch.users[0] === currentUserId ? foundMatch.users[1] : foundMatch.users[0];
      const user = mockUsers.find(u => u.id === otherUserId);
      if (user) {
        setMatchedUser(user);
      }
      
      // 在实际应用中，这里会从API获取消息历史
      // 这里我们模拟一些消息
      const mockMessages: Message[] = [
        {
          id: '1',
          matchId,
          senderId: otherUserId,
          text: '你好，很高兴认识你！',
          timestamp: new Date(Date.now() - 3600000 * 2), // 2小时前
          read: true
        },
        {
          id: '2',
          matchId,
          senderId: currentUserId,
          text: '你好！我也很高兴认识你 😊',
          timestamp: new Date(Date.now() - 3600000), // 1小时前
          read: true
        }
      ];
      
      setMessages(mockMessages);
    }
  }, [matchId]);
  
  // 滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !match) return;
    
    // 创建新消息
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      matchId,
      senderId: currentUserId,
      text: newMessage,
      timestamp: new Date(),
      read: false
    };
    
    // 添加到消息列表
    setMessages(prev => [...prev, newMsg]);
    
    // 清空输入框
    setNewMessage('');
    
    // 在实际应用中，这里会调用API发送消息
  };
  
  // 格式化消息时间
  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!matchedUser || !match) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>聊天</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/matches" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex items-center justify-center h-full">
            <p>加载中...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/matches" />
          </IonButtons>
          <IonTitle>{matchedUser.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent ref={contentRef} className="ion-padding">
        <div className="flex flex-col space-y-4">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              {message.senderId !== currentUserId && (
                <IonAvatar className="mr-2 w-8 h-8">
                  <img src={matchedUser.images[0]} alt={matchedUser.name} />
                </IonAvatar>
              )}
              
              <div 
                className={`p-3 rounded-lg max-w-[70%] ${
                  message.senderId === currentUserId 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{message.text}</p>
                <div 
                  className={`text-xs mt-1 ${
                    message.senderId === currentUserId 
                      ? 'text-primary-100' 
                      : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </IonContent>
      
      <IonFooter>
        <div className="p-2 bg-white border-t">
          <div className="flex items-center">
            <IonInput
              placeholder="输入消息..."
              value={newMessage}
              onIonChange={e => setNewMessage(e.detail.value || '')}
              className="flex-grow bg-gray-100 rounded-full px-4"
            />
            <IonButton 
              fill="clear" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <IonIcon icon={send} slot="icon-only" color="primary" />
            </IonButton>
          </div>
        </div>
      </IonFooter>
    </IonPage>
  );
} 