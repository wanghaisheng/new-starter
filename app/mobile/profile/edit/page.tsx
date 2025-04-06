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
import { useServices } from '@/core/hooks/useServices';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import { CameraService } from '@/core/services/camera-service';

export default function EditProfilePage() {
  const router = useRouter();
  const { userService, isLoading, error } = useServices();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const cameraService = CameraService.getInstance();

  useEffect(() => {
    loadUserData();
  }, [userService]);

  const loadUserData = async () => {
    if (!userService) return;

    try {
      const user = await userService.getCurrentUser();
      if (!user) {
        setToastMessage('无法加载用户数据');
        setShowToast(true);
        return;
      }
      setCurrentUser(user);
    } catch (err) {
      console.error('Error loading user data:', err);
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    }
  };

  const handleImageUpload = async () => {
    try {
      const photo = await cameraService.takePicture();
      if (photo && currentUser && photo.webPath) {
        const tempPhoto = {
          url: photo.webPath,
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
      console.error('Error uploading image:', err);
      setToastMessage('上传图片失败');
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
    if (!currentUser || !userService) return;

    try {
      setIsSaving(true);
      await userService.updateUser(currentUser.id, currentUser);
      setToastMessage('保存成功');
      setShowToast(true);
      setTimeout(() => {
        router.push('/mobile/profile');
      }, 1500);
    } catch (err) {
      console.error('Error saving user data:', err);
      setToastMessage('保存失败，请重试');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>编辑资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/profile" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <LoadingSpinner message="加载中..." />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>编辑资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/mobile/profile" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay 
            error={error?.toString() || '未找到用户数据'} 
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
          <IonTitle>编辑资料</IonTitle>
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
            <h2 className="text-lg font-semibold mb-4 text-white">基本信息</h2>
            <IonItem>
              <IonLabel position="stacked">姓名</IonLabel>
              <IonInput
                value={currentUser.name}
                onIonChange={e => setCurrentUser({ ...currentUser, name: e.detail.value || '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">个人简介</IonLabel>
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
              <h2 className="text-lg font-semibold text-white">照片</h2>
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
            <h2 className="text-lg font-semibold mb-4 text-white">兴趣爱好</h2>
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
                placeholder="添加新的兴趣爱好"
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