'use client';

import React, { useState } from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonIcon, IonButton } from '@ionic/react';
import { locationOutline, mailOutline, chevronBack, chevronForward } from 'ionicons/icons';
import { User, Location } from '@/core/lib/db/models/user';

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
        
        {/* 图片导航按钮 */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2 z-10">
          <IonButton 
            fill="clear" 
            color="light"
            onClick={handlePreviousImage}
            className="bg-black/30 rounded-full"
          >
            <IonIcon icon={chevronBack} slot="icon-only" />
          </IonButton>
          <IonButton 
            fill="clear" 
            color="light"
            onClick={handleNextImage}
            className="bg-black/30 rounded-full"
          >
            <IonIcon icon={chevronForward} slot="icon-only" />
          </IonButton>
        </div>
        
        {/* 图片指示器 */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-10">
          {user.photos.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
        
        {/* 用户基本信息 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold">{user.name}, {user.age}</h2>
              <div className="flex items-center text-sm">
                <IonIcon icon={locationOutline} className="mr-1" />
                {getLocationText(user.location)}
              </div>
            </div>
            {editable && onEdit && (
              <IonButton fill="clear" color="light" onClick={onEdit}>
                编辑
              </IonButton>
            )}
          </div>
        </div>
      </div>
      
      <IonCardContent>
        <h3 className="font-semibold mb-2">关于我</h3>
        <p className="text-sm mb-4">{user.bio}</p>
        
        <h3 className="font-semibold mb-2">兴趣爱好</h3>
        <div className="flex flex-wrap gap-1">
          {user.interests.map((interest, index) => (
            <IonChip key={index} className="bg-primary-100 text-primary-800">
              <IonLabel>{interest}</IonLabel>
            </IonChip>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default UserProfileCard;