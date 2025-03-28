'use client';

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonLoading } from '@ionic/react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/core/components/ProfileCard';
import { User } from '@/core/models/user';
import { UserService } from '@/core/services/user-service';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userService = UserService.getInstance();
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = await userService.getCurrentUser();
      if (!user) {
        setError('无法加载用户数据');
        return;
      }
      setCurrentUser(user);
    } catch (err) {
      setError('加载用户数据时出错');
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
    router.push('/profile/edit');
  };
  
  const handleSettings = () => {
    router.push('/settings');
  };
  
  if (isLoading) {
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
            <IonTitle>个人资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadUserData}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg"
            >
              重试
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }
  
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
            <p>未找到用户数据</p>
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