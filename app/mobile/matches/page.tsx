'use client';

import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton, 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel, 
  IonBadge,
  IonLoading,
  IonToast
} from '@ionic/react';
import { useRouter } from 'next/navigation';
import { Match, User } from '@/core/models/user';
import { UserService } from '@/core/services/user-service';

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const userService = UserService.getInstance();
  
  useEffect(() => {
    loadMatches();
  }, []);
  
  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const currentUser = await userService.getCurrentUser();
      if (!currentUser) {
        setError('无法加载用户数据');
        return;
      }

      const userMatches = await userService.getMatches(currentUser.id);
      setMatches(userMatches);
      
      // 获取所有匹配用户的信息
      const usersMap: Record<string, User> = {};
      for (const match of userMatches) {
        const otherUserId = match.users[0] === currentUser.id ? match.users[1] : match.users[0];
        const user = await userService.getUserById(otherUserId);
        if (user) {
          usersMap[otherUserId] = user;
        }
      }
      setUsers(usersMap);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('加载匹配数据时出错');
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取匹配用户的信息
  const getMatchedUser = (match: Match) => {
    const currentUser = matches[0]?.users[0] || '';
    const otherUserId = match.users[0] === currentUser ? match.users[1] : match.users[0];
    return users[otherUserId];
  };
  
  // 格式化最后消息时间
  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // 不到一分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 不到一小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    
    // 不到一天
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    
    // 不到一周
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }
    
    // 其他情况显示日期
    return timestamp.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>匹配列表</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
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

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>匹配列表</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadMatches}
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
          <IonTitle>匹配列表</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonList>
          {matches.map(match => {
            const matchedUser = getMatchedUser(match);
            if (!matchedUser) return null;

            return (
              <IonItem 
                key={match.id}
                button
                onClick={() => router.push(`/matches/${match.id}`)}
              >
                <IonAvatar slot="start" className="w-12 h-12">
                  <img src={matchedUser.images[0]} alt={matchedUser.name} />
                </IonAvatar>
                <IonLabel>
                  <h2>{matchedUser.name}</h2>
                  <p>{matchedUser.bio}</p>
                  {match.lastMessage && (
                    <p className="text-sm text-gray-500">
                      {match.lastMessage.text}
                    </p>
                  )}
                </IonLabel>
                {match.lastMessage && (
                  <IonBadge slot="end" color="primary">
                    {formatLastMessageTime(match.lastMessage.timestamp)}
                  </IonBadge>
                )}
              </IonItem>
            );
          })}
        </IonList>
      </IonContent>

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