'use client';

import React, { useState } from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonIcon, IonButton } from '@ionic/react';
import { locationOutline, mailOutline, chevronBack, chevronForward } from 'ionicons/icons';
import { User, Location } from '@/core/models/user';

interface UserProfileCardProps {
  user: User;
  editable?: boolean;
  onEdit?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ 
  user, 
  editable = false,
  onEdit 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? user.photos.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === user.photos.length - 1 ? 0 : prev + 1
    );
  };

  const getLocationText = (location: string | Location) => {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  return (
    <IonCard className="overflow-hidden">
      {/* 图片轮播区域 */}
      <div className="relative h-96">
        <div className="absolute top-0 left-0 w-full h-full">
          {user.photos.map((photo, index) => (
            <IonImg
              key={index}
              src={photo}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
        {user.photos.length > 1 && (
          <>
            <IonButton
              fill="clear"
              color="light"
              className="absolute left-2 top-1/2 -translate-y-1/2"
              onClick={handlePreviousImage}
            >
              <IonIcon icon={chevronBack} />
            </IonButton>
            <IonButton
              fill="clear"
              color="light"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={handleNextImage}
            >
              <IonIcon icon={chevronForward} />
            </IonButton>
          </>
        )}
        {editable && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-lg"
          >
            <IonIcon icon={mailOutline} className="w-6 h-6 text-gray-600" />
          </button>
        )}
      </div>

      {/* 用户信息区域 */}
      <IonCardContent>
        <div className="space-y-4">
          {/* 基本信息 */}
          <div>
            <h2 className="text-2xl font-bold flex items-center justify-between">
              {user.name}, {user.age}
            </h2>
            <p className="text-gray-600 flex items-center mt-1">
              <IonIcon icon={locationOutline} className="mr-1" />
              {getLocationText(user.location)}
            </p>
          </div>

          {/* 个人简介 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">关于我</h3>
            <p className="text-gray-600">{user.bio}</p>
          </div>

          {/* 兴趣标签 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">兴趣爱好</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <IonChip 
                  key={index} 
                  className="bg-primary-100 text-primary-800"
                >
                  <IonLabel>{interest}</IonLabel>
                </IonChip>
              ))}
            </div>
          </div>

          {/* 创建时间 */}
          <div className="text-sm text-gray-500">
            加入时间：{new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
}; 