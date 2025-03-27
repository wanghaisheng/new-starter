'use client';

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { person, chatbubbles, heart, close } from 'ionicons/icons';
import { useRouter } from 'next/navigation';
import { SwipeCard } from '@/core/components/SwipeCard';
import { User } from '@/core/models/user';
import { mockUsers } from '@/core/lib/db/mock/users';

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    // 在实际应用中，这里会从API获取用户数据
    setUsers(mockUsers);
  }, []);
  
  const handleSwipe = (direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on user ${users[currentIndex]?.name}`);
    
    // 如果是右滑（喜欢），这里可以调用API记录匹配
    if (direction === 'right') {
      // 模拟匹配逻辑
      const matchChance = Math.random();
      if (matchChance > 0.7) {
        alert(`恭喜！你与 ${users[currentIndex]?.name} 匹配成功！`);
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
    </IonPage>
  );
} 