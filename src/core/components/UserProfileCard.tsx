'use client';

import React from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonIcon } from '@ionic/react';
import { locationOutline, mailOutline, callOutline } from 'ionicons/icons';
import { User } from '@/core/models/user';

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
  return (
    <IonCard className="overflow-hidden">
      {/* 图片轮播区域 */}
      <div className="relative h-96">
        <div className="absolute top-0 left-0 w-full h-full">
          {user.images.map((image, index) => (
            <IonImg
              key={index}
              src={image}
              className="w-full h-full object-cover absolute top-0 left-0"
              style={{ opacity: index === 0 ? 1 : 0 }}
            />
          ))}
        </div>
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
              {user.location.latitude.toFixed(4)}, {user.location.longitude.toFixed(4)}
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