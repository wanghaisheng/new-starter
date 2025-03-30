'use client';

import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonSpinner,
  IonToast
} from '@ionic/react';
import { person, chatbubbles, heart, close } from 'ionicons/icons';
import { useRouter } from 'next/navigation';
import { SwipeCard } from '@/mobile/components/cards/SwipeCard';
import { User } from '@/core/models/user';
import { UserService } from '@/core/services/user-service';

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const userService = UserService.getInstance();
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await userService.getUsers();
      const currentUser = await userService.getCurrentUser();
      
      if (!currentUser) {
        setError('请先登录');
        return;
      }

      // 过滤掉当前用户和已匹配的用户
      const matches = await userService.getMatches();
      const matchedUserIds = matches.flatMap(match => match.users);
      
      const filteredUsers = allUsers.filter(user => 
        user.id !== currentUser.id && 
        !matchedUserIds.includes(user.id)
      );
      
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('加载用户数据时出错');
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentUser = await userService.getCurrentUser();
    if (!currentUser) {
      setToastMessage('请先登录');
      setShowToast(true);
      return;
    }

    const swipedUser = users[currentIndex];
    if (!swipedUser) return;

    if (direction === 'right') {
      try {
        // 创建匹配
        const match = await userService.createMatch(currentUser.id, swipedUser.id);
        setToastMessage(`恭喜！你与 ${swipedUser.name} 匹配成功！`);
        setShowToast(true);
      } catch (err) {
        console.error('Error creating match:', err);
        setToastMessage('创建匹配失败');
        setShowToast(true);
      }
    }
    
    // 移动到下一个用户
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };
  
  const handleManualSwipe = (direction: 'left' | 'right') => {
    handleSwipe(direction);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>SwipeMeet</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => router.push('/profile')}>
                <IonIcon icon={person} slot="icon-only" />
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={() => router.push('/matches')}>
                <IonIcon icon={chatbubbles} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex items-center justify-center h-full">
            <IonSpinner name="crescent" />
            <span className="ml-2">加载中...</span>
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
            <IonTitle>SwipeMeet</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => router.push('/profile')}>
                <IonIcon icon={person} slot="icon-only" />
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={() => router.push('/matches')}>
                <IonIcon icon={chatbubbles} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadUsers}
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
          <IonTitle>SwipeMeet</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push('/profile')}>
              <IonIcon icon={person} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={() => router.push('/matches')}>
              <IonIcon icon={chatbubbles} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="h-full flex flex-col">
          <div className="flex-grow relative">
            {currentIndex < users.length ? (
              <SwipeCard 
                user={users[currentIndex]} 
                onSwipe={handleSwipe} 
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <h2 className="text-xl font-semibold mb-2">暂时没有更多用户了</h2>
                  <p className="text-gray-500 mb-4">稍后再来看看吧！</p>
                  <IonButton onClick={() => setCurrentIndex(0)}>
                    重新开始
                  </IonButton>
                </div>
              </div>
            )}
          </div>
          
          {currentIndex < users.length && (
            <div className="flex justify-center gap-4 py-4">
              <IonButton 
                shape="round" 
                color="danger"
                onClick={() => handleManualSwipe('left')}
              >
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
              <IonButton 
                shape="round" 
                color="success"
                onClick={() => handleManualSwipe('right')}
              >
                <IonIcon icon={heart} slot="icon-only" />
              </IonButton>
            </div>
          )}
        </div>
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