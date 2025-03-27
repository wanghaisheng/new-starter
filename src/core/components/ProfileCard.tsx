'use client';

import React from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonButton, IonIcon } from '@ionic/react';
import { pencil, settings } from 'ionicons/icons';
import { User } from '@/core/models/user';

interface ProfileCardProps {
  user: User;
  onEdit: () => void;
  onSettings: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEdit, onSettings }) => {
  return (
    <IonCard className="overflow-hidden">
      <div className="relative">
        <IonImg src={user.images[0]} className="w-full h-64 object-cover" />
        <div className="absolute top-2 right-2 flex gap-2">
          <IonButton fill="clear" color="light" onClick={onEdit}>
            <IonIcon icon={pencil} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" color="light" onClick={onSettings}>
            <IonIcon icon={settings} slot="icon-only" />
          </IonButton>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <h2 className="text-2xl font-bold">{user.name}, {user.age}</h2>
          <p className="text-sm">{user.location}</p>
        </div>
      </div>
      <IonCardContent>
        <h3 className="font-semibold mb-2">关于我</h3>
        <p className="text-sm mb-4">{user.bio}</p>
        
        <h3 className="font-semibold mb-2">兴趣爱好</h3>
        <div className="flex flex-wrap gap-1 mb-4">
          {user.interests.map((interest, index) => (
            <IonChip key={index} className="bg-primary-100 text-primary-800">
              <IonLabel>{interest}</IonLabel>
            </IonChip>
          ))}
        </div>
        
        <h3 className="font-semibold mb-2">照片集</h3>
        <div className="grid grid-cols-3 gap-2">
          {user.images.map((image, index) => (
            <IonImg key={index} src={image} className="w-full h-24 object-cover rounded-md" />
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
}; 