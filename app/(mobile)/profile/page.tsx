'use client';

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/core/components/ProfileCard';
import { User } from '@/core/models/user';
import { mockUsers } from '@/core/lib/db/mock/users';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    // 在实际应用中，这里会从API获取当前用户数据
    // 这里我们假设当前用户是第一个用户
    setCurrentUser(mockUsers[0]);
  }, []);
  
  const handleEdit = () => {
    router.push('/profile/edit');
  };
  
  const handleSettings = () => {
    router.push('/settings');
  };
  
  if (!currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>个人资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
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
          <IonTitle>个人资料</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <ProfileCard 
          user={currentUser}
          onEdit={handleEdit}
          onSettings={handleSettings}
        />
      </IonContent>
    </IonPage>
  );
} 