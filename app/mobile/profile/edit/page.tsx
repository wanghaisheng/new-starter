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
  IonLoading,
  IonToast,
  IonChip,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { add, remove, camera } from 'ionicons/icons';
import { useRouter } from 'next/navigation';
import { User } from '@/core/lib/db/models/user';
import { UserService } from '@/core/services/user-service';
import { CameraService } from '@/core/services/camera-service';

export default function EditProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const userService = UserService.getInstance();
  const cameraService = CameraService.getInstance();

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
      console.error('Error loading user data:', err);
      setError('加载用户数据时出错');
      setToastMessage('加载失败，请重试');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const photo = await cameraService.takePicture();
      if (photo && currentUser && photo.webPath) {
        setCurrentUser({
          ...currentUser,
          photos: [...currentUser.photos, photo.webPath]
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
    const newImages = [...currentUser.photos];
    newImages.splice(index, 1);
    setCurrentUser({
      ...currentUser,
      photos: newImages
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

    try {
      setIsSaving(true);
      await userService.updateUser(currentUser.id, currentUser);
      setToastMessage('保存成功');
      setShowToast(true);
      setTimeout(() => {
        router.push('/profile');
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
              <IonBackButton defaultHref="/profile" />
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

  if (error || !currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>编辑资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error || '未找到用户数据'}</p>
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>编辑资料</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <IonItem>
              <IonLabel position="stacked">姓名</IonLabel>
              <IonInput
                value={currentUser.name}
                onIonChange={e => setCurrentUser({ ...currentUser, name: e.detail.value || '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">年龄</IonLabel>
              <IonInput
                type="number"
                value={currentUser.age}
                onIonChange={e => setCurrentUser({ ...currentUser, age: parseInt(e.detail.value || '0') })}
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
              <h2 className="text-lg font-semibold">照片</h2>
              <IonButton onClick={handleImageUpload}>
                <IonIcon icon={camera} slot="start" />
                添加照片
              </IonButton>
            </div>
            <IonGrid>
              <IonRow>
                {currentUser.photos.map((image, index) => (
                  <IonCol size="4" key={index}>
                    <div className="relative">
                      <img src={image} alt={`照片 ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
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
            <h2 className="text-lg font-semibold mb-4">兴趣爱好</h2>
            <div className="flex gap-2 mb-4">
              <IonInput
                value={newInterest}
                placeholder="添加兴趣爱好"
                onIonChange={e => setNewInterest(e.detail.value || '')}
              />
              <IonButton onClick={handleAddInterest}>
                <IonIcon icon={add} slot="icon-only" />
              </IonButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentUser.interests.map((interest, index) => (
                <IonChip key={index}>
                  <IonLabel>{interest}</IonLabel>
                  <IonIcon icon={remove} onClick={() => handleRemoveInterest(interest)} />
                </IonChip>
              ))}
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