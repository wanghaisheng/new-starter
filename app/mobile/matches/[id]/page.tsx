'use client';

import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton, 
  IonLoading,
  IonToast,
  IonContent,
  IonFooter
} from '@ionic/react';
import { useParams } from 'next/navigation';
import { Match, User } from '@/core/models/user';
import { UserService } from '@/core/services/user-service';
import { MessageService } from '@/core/services/message-service';
import RealTimeChat from '@/mobile/components/messages/RealTimeChat';
import MessageInput from '@/mobile/components/messages/MessageInput';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const userService = UserService.getInstance();
  const messageService = MessageService.getInstance();
  
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
      
      setCurrentUserId(currentUser.id);

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
    } catch (err) {
      console.error('Error loading chat data:', err);
      setError('加载聊天数据时出错');
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || !match || !matchedUser || !currentUserId) {
      setToastMessage('发送失败：消息为空或用户未登录');
      setShowToast(true);
      return Promise.reject(new Error('消息为空或用户未登录'));
    }

    try {
      // 获取匹配用户ID
      const receiverId = match.users.find(id => id !== currentUserId);
      if (!receiverId) {
        setToastMessage('发送失败：找不到接收者');
        setShowToast(true);
        return Promise.reject(new Error('找不到接收者'));
      }

      // 使用MessageService发送消息
      const result = await messageService.sendMessage(
        matchId,
        currentUserId,
        receiverId,
        content.trim()
      );
      
      if (!result.success) {
        const errorMsg = result.errors?.join(', ') || '发送失败';
        setToastMessage(errorMsg);
        setShowToast(true);
        return Promise.reject(new Error(errorMsg));
      }
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error sending message:', err);
      setToastMessage('发送失败，请重试');
      setShowToast(true);
      return Promise.reject(err);
    }
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
      
      {/* 使用RealTimeChat组件显示消息 */}
      <RealTimeChat
        matchId={matchId}
        currentUserId={currentUserId}
        matchedUser={matchedUser}
      />
      
      {/* 使用MessageInput组件发送消息 */}
      <IonFooter>
        <MessageInput
          matchId={matchId}
          senderId={currentUserId}
          receiverId={match.users.find(id => id !== currentUserId) || ''}
          onSendMessage={handleSendMessage}
        />
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