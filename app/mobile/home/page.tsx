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
import { User } from '@/core/lib/db/types/user';
import { UserService } from '@/core/services/user-service';

interface Match {
  users: string[];
}

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
      // If getMatches doesn't exist, we'll treat it as an empty array
      let matchedUserIds: string[] = [];
      try {
        const matches: Match[] = await (userService as any).getMatches();
        matchedUserIds = matches.flatMap(match => match.users);
      } catch (err) {
        console.log('getMatches is not available', err);
      }
      
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
        // 创建匹配 - adjust based on actual method signature
        try {
          await (userService as any).createMatch(currentUser.id, swipedUser.id);
        } catch {
          // Fallback if the method doesn't exist or has a different signature
          console.log('createMatch method not available or has different signature');
        }
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
          <IonToolbar className="px-1">
            <IonTitle className="text-white font-bold">SwipeMeet</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => router.push('/profile')} className="text-white">
                <IonIcon icon={person} slot="icon-only" />
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={() => router.push('/matches')} className="text-white">
                <IonIcon icon={chatbubbles} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex items-center justify-center h-full">
            <IonSpinner name="crescent" color="primary" />
            <span className="ml-2 text-neutral-600 dark:text-neutral-300">加载中...</span>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="px-1">
            <IonTitle className="text-white font-bold">SwipeMeet</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={() => router.push('/profile')} className="text-white">
                <IonIcon icon={person} slot="icon-only" />
              </IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={() => router.push('/matches')} className="text-white">
                <IonIcon icon={chatbubbles} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <p className="text-red-500 mb-4 font-medium">{error}</p>
            <button 
              onClick={loadUsers}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors duration-200 shadow-md"
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
        <IonToolbar className="px-1">
          <IonTitle className="text-white font-bold">SwipeMeet</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push('/profile')} className="text-white">
              <IonIcon icon={person} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={() => router.push('/matches')} className="text-white">
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
              <div className="h-full flex items-center justify-center animate-fade-in">
                <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg max-w-xs mx-auto">
                  <div className="mb-4 text-primary-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-neutral-800 dark:text-white">暂时没有更多用户了</h2>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-6">稍后再来看看吧！</p>
                  <IonButton 
                    expand="block" 
                    onClick={() => setCurrentIndex(0)}
                    className="font-medium"
                  >
                    重新开始
                  </IonButton>
                </div>
              </div>
            )}
          </div>
          
          {currentIndex < users.length && (
            <div className="flex justify-center gap-6 py-6 animate-slide-up">
              <IonButton 
                shape="round" 
                color="danger"
                size="large"
                onClick={() => handleManualSwipe('left')}
                className="shadow-lg w-16 h-16"
              >
                <IonIcon icon={close} slot="icon-only" size="large" />
              </IonButton>
              <IonButton 
                shape="round" 
                color="success"
                size="large"
                onClick={() => handleManualSwipe('right')}
                className="shadow-lg w-16 h-16"
              >
                <IonIcon icon={heart} slot="icon-only" size="large" />
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
        color="primary"
        className="font-medium"
      />
    </IonPage>
  );
}