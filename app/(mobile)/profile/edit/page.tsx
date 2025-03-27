'use client';

import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonChip, IonIcon, IonList, IonItemDivider } from '@ionic/react';
import { add, close, camera } from 'ionicons/icons';
import { useRouter } from 'next/navigation';
import { User } from '@/core/models/user';
import { mockUsers } from '@/core/lib/db/mock/users';
import { CameraService } from '@/mobile/plugins/camera-service';

export default function ProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  // 当前用户ID（在实际应用中会从认证服务获取）
  const currentUserId = '1';
  
  useEffect(() => {
    // 在实际应用中，这里会从API获取当前用户数据
    const currentUser = mockUsers.find(u => u.id === currentUserId);
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.name);
      setAge(currentUser.age.toString());
      setBio(currentUser.bio);
      setLocation(currentUser.location);
      setInterests([...currentUser.interests]);
      setImages([...currentUser.images]);
    }
  }, []);
  
  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };
  
  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };
  
  const handleAddImage = async () => {
    try {
      const cameraService = CameraService.getInstance();
      const imagePath = await cameraService.takePicture();
      
      if (imagePath) {
        setImages([...images, imagePath]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      alert('无法访问相机，请检查权限设置');
    }
  };
  
  const handleRemoveImage = (image: string) => {
    setImages(images.filter(i => i !== image));
  };
  
  const handleSave = () => {
    if (!name || !age || !bio || !location) {
      alert('请填写所有必填字段');
      return;
    }
    
    if (images.length === 0) {
      alert('请至少上传一张照片');
      return;
    }
    
    // 在实际应用中，这里会调用API保存用户数据
    // 这里我们只是模拟保存
    alert('个人资料已更新');
    router.push('/profile');
  };
  
  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>编辑个人资料</IonTitle>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
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
          <IonTitle>编辑个人资料</IonTitle>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>保存</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonList>
          <IonItemDivider>基本信息</IonItemDivider>
          
          <IonItem>
            <IonLabel position="stacked">姓名 *</IonLabel>
            <IonInput 
              value={name} 
              onIonChange={e => setName(e.detail.value || '')}
              placeholder="输入你的姓名"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">年龄 *</IonLabel>
            <IonInput 
              type="number" 
              value={age} 
              onIonChange={e => setAge(e.detail.value || '')}
              placeholder="输入你的年龄"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">所在地 *</IonLabel>
            <IonInput 
              value={location} 
              onIonChange={e => setLocation(e.detail.value || '')}
              placeholder="输入你的所在地"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">个人简介 *</IonLabel>
            <IonTextarea 
              value={bio} 
              onIonChange={e => setBio(e.detail.value || '')}
              placeholder="介绍一下自己..."
              rows={4}
            />
          </IonItem>
          
          <IonItemDivider>兴趣爱好</IonItemDivider>
          
          <div className="p-4 flex flex-wrap gap-2">
            {interests.map(interest => (
              <IonChip key={interest} className="bg-primary-100 text-primary-800">
                <IonLabel>{interest}</IonLabel>
                <IonIcon icon={close} onClick={() => handleRemoveInterest(interest)} />
              </IonChip>
            ))}
          </div>
          
          <IonItem>
            <IonInput 
              value={newInterest} 
              onIonChange={e => setNewInterest(e.detail.value || '')}
              placeholder="添加兴趣爱好"
            />
            <IonButton 
              slot="end" 
              fill="clear"
              onClick={handleAddInterest}
              disabled={!newInterest.trim()}
            >
              <IonIcon icon={add} slot="icon-only" />
            </IonButton>
          </IonItem>
          
          <IonItemDivider>照片</IonItemDivider>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`照片 ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button 
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    onClick={() => handleRemoveImage(image)}
                  >
                    <IonIcon icon={close} size="small" />
                  </button>
                </div>
              ))}
              
              {images.length < 6 && (
                <div 
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer"
                  onClick={handleAddImage}
                >
                  <IonIcon icon={camera} size="large" className="text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">最多上传6张照片</p>
          </div>
        </IonList>
      </IonContent>
    </IonPage>
  );
} 