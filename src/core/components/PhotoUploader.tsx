'use client';

import React, { useState } from 'react';
import { IonButton, IonIcon, IonActionSheet } from '@ionic/react';
import { camera, images, trash } from 'ionicons/icons';

interface PhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos = [],
  onPhotosChange,
  maxPhotos = 6
}) => {
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // 模拟照片上传功能
  const handleAddPhoto = () => {
    // 在实际应用中，这里会调用相机或文件选择API
    // 现在我们只是添加一个占位图像
    if (photos.length < maxPhotos) {
      const newPhotos = [...photos];
      // 使用随机图片作为示例
      const randomId = Math.floor(Math.random() * 1000);
      newPhotos.push(`https://picsum.photos/500/500?random=${randomId}`);
      onPhotosChange(newPhotos);
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowActionSheet(true);
  };

  const handleDeletePhoto = () => {
    if (selectedPhotoIndex !== null) {
      const newPhotos = [...photos];
      newPhotos.splice(selectedPhotoIndex, 1);
      onPhotosChange(newPhotos);
      setSelectedPhotoIndex(null);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handlePhotoClick(index)}
          >
            <img src={photo} alt={`照片 ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <div 
            className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg cursor-pointer"
            onClick={handleAddPhoto}
          >
            <IonIcon icon={images} size="large" className="text-gray-500" />
          </div>
        )}
      </div>
      
      <IonButton expand="block" onClick={handleAddPhoto} disabled={photos.length >= maxPhotos}>
        <IonIcon icon={camera} slot="start" />
        上传照片
      </IonButton>
      
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: '删除照片',
            role: 'destructive',
            icon: trash,
            handler: handleDeletePhoto
          },
          {
            text: '取消',
            role: 'cancel'
          }
        ]}
      />
    </div>
  );
};