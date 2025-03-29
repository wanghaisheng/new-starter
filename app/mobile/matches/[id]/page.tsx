'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton, 
  IonFooter, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonIcon, 
  IonAvatar, 
  IonLabel,
  IonLoading,
  IonToast,
  IonImg
} from '@ionic/react';
import { send } from 'ionicons/icons';
import { useParams } from 'next/navigation';
import { Match, Message, User } from '@/core/models/user';
import { UserService } from '@/core/services/user-service';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const contentRef = useRef<HTMLIonContentElement>(null);
  const userService = UserService.getInstance();
  
  useEffect(() => {
    loadChatData();
  }, [matchId]);
  
  const loadChatData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setError('无法加载用户数据');
        return;
      }

      // 获取匹配信息
      const userMatches = await userService.getMatches(currentUser.id);
      const currentMatch = userMatches.find(m => m.id === matchId);
      if (!currentMatch) {
        setError('找不到匹配信息');
        return;
      }
      setMatch(currentMatch);

      // 获取匹配用户信息
      const otherUserId = currentMatch.users[0] === currentUser.id ? currentMatch.users[1] : currentMatch.users[0];
      const user = await userService.getUserById(otherUserId);
      if (!user) {
        setError('找不到用户信息');
        return;
      }
      setMatchedUser(user);

      // 获取消息历史
      const chatMessages = await userService.getMessages(matchId);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Error loading chat data:', err);
      setError('加载聊天数据时出错');
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !match || !matchedUser) return;

    try {
      setIsSending(true);
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setToastMessage('发送失败：用户未登录');
        setShowToast(true);
        return;
      }

      const result = await userService.sendMessage(matchId, currentUser.id, newMessage.trim());
      
      if (result.success && result.message) {
        setMessages(prev => [...prev, result.message as Message]);
        setNewMessage('');
      } else {
        setToastMessage(result.errors?.join(', ') || 'Failed to send message');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setToastMessage('发送失败，请重试');
      setShowToast(true);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
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
            <IonLoading isOpen={true} message="加载中..." />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !match || !matchedUser) {
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
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error || '无法加载聊天数据'}</p>
            <button 
              onClick={loadChatData}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg"
            >
              重试
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{matchedUser.name}</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/matches" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent ref={contentRef} className="ion-padding">
        <div className="flex flex-col space-y-4">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.senderId === matchedUser.id ? 'justify-start' : 'justify-end'}`}
            >
              {message.senderId === matchedUser.id && (
                <IonAvatar className="mr-2 w-8 h-8">
                  <img src={matchedUser.photos?.[0] || '/assets/default-avatar.png'} alt={matchedUser.name} />
                </IonAvatar>
              )}
              
              <div 
                className={`p-3 rounded-lg max-w-[70%] ${
                  message.senderId === matchedUser.id
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-primary-600 text-white'
                }`}
              >
                <div className="flex flex-col">
                  <div className="text-sm font-medium">
                    {message.senderId === matchedUser.id ? 'You' : matchedUser.name}
                  </div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </IonContent>
      
      <IonFooter>
        <IonToolbar>
          <IonItem lines="none">
            <IonInput
              value={newMessage}
              onIonChange={e => setNewMessage(e.detail.value || '')}
              placeholder="输入消息..."
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <IonButton 
              slot="end" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              <IonIcon icon={send} slot="icon-only" />
            </IonButton>
          </IonItem>
        </IonToolbar>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
} 