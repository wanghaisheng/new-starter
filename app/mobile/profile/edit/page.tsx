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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonToast,
  IonChip,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { add, remove, camera } from 'ionicons/icons';
import { useRouter } from 'next/navigation';
import { User } from '@/core/lib/db/types/user';
import { CreatePhotoData } from '@/core/lib/db/types/photo';
import { useUser } from '@/core/hooks/useUser';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import { CameraServiceFactory } from '@/core/services/business/phone/camera/factory/camera-service-factory';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function EditProfilePage() {
  useRequireAuth();
  const router = useRouter();
  const { user, updateUser, loading, updateError } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const cameraService = CameraServiceFactory.create();

  useEffect(() => {
    if (!user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setCurrentUser(user);
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleImageUpload = async () => {
    try {
      const photo = await cameraService.takePhoto();
      if (photo && currentUser && photo.uri) {
        const tempPhoto = {
          url: photo.uri,
          order: currentUser.photos.length,
          isMain: currentUser.photos.length === 0,
          userId: currentUser.id
        };
        
        setCurrentUser({
          ...currentUser,
          photos: [...currentUser.photos, tempPhoto as any]
        });
      }
    } catch (err) {
      console.error('上传照片失败:', err);
      setToastMessage('上传照片失败，请重试');
      setShowToast(true);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!currentUser) return;
    const newPhotos = [...currentUser.photos];
    newPhotos.splice(index, 1);
    setCurrentUser({
      ...currentUser,
      photos: newPhotos
    });
  };

  const handleAddInterest = () => {
    if (!currentUser || !newInterest.trim()) return;
    
    if (!currentUser.interests.includes(newInterest.trim())) {
      setCurrentUser({
        ...currentUser,
        interests: [...currentUser.interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      interests: currentUser.interests.filter(i => i !== interest)
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await updateUser(currentUser);
      setToastMessage('保存成功');
      setShowToast(true);
      setTimeout(() => router.back(), 1000);
    } catch (err: any) {
      console.error('保存用户资料失败:', err);
      setToastMessage(err.message || '保存失败，请重试');
      setShowToast(true);
      // 可在此处添加埋点 logEvent('profile_save_failed', { error: err.message })
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (updateError) {
      setToastMessage(updateError.message || '更新失败');
      setShowToast(true);
    }
  }, [updateError]);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle{t('auto.page.')}/IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/profile" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message={t('auto.page.')} />
        </IonContent>
      </IonPage>
    );
  }

  if (updateError || !currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle{t('auto.page.')}/IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/profile" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay 
            error={updateError?.toString() || '未找到用户数据'} 
            onRetry={loadUserData} 
          />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle{t('auto.page.')}/IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mobile/profile" />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-[#0f172a]">
        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* 基本信息 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white"{t('auto.page.')}/h2>
            <IonItem>
              <IonLabel position="stacked"{t('auto.page.')}/IonLabel>
              <IonInput
                value={currentUser.name}
                onIonChange={e => setCurrentUser({ ...currentUser, name: e.detail.value || '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked"{t('auto.page.')}/IonLabel>
              <IonTextarea
                value={currentUser.bio}
                onIonChange={e => setCurrentUser({ ...currentUser, bio: e.detail.value || '' })}
                rows={4}
              />
            </IonItem>
          </div>

          {/* 照片 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white"{t('auto.page.')}/h2>
              <IonButton onClick={handleImageUpload}>
                <IonIcon icon={camera} slot="start" />
                添加照片
              </IonButton>
            </div>
            <IonGrid>
              <IonRow>
                {currentUser.photos.map((photo, index) => (
                  <IonCol size="4" key={index}>
                    <div className="relative">
                      <img 
                        src={photo.url} 
                        alt={`照片 ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-md" 
                      />
                      <IonButton
                        fill="clear"
                        color="danger"
                        className="absolute top-0 right-0"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <IonIcon icon={remove} />
                      </IonButton>
                    </div>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>

          {/* 兴趣爱好 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-white"{t('auto.page.')}/h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {currentUser.interests.map((interest, index) => (
                <IonChip key={index}>
                  <IonLabel>{interest}</IonLabel>
                  <IonIcon icon={remove} onClick={() => handleRemoveInterest(interest)} />
                </IonChip>
              ))}
            </div>
            <div className="flex gap-2">
              <IonInput
                value={newInterest}
                placeholder={t('auto.page.')}
                onIonChange={e => setNewInterest(e.detail.value || '')}
              />
              <IonButton onClick={handleAddInterest}>
                <IonIcon icon={add} slot="start" />
                添加
              </IonButton>
            </div>
          </div>
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