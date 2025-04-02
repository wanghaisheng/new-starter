'use client';

import { motion, PanInfo } from 'framer-motion';
import { User } from '@/core/lib/db/models/user';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonImg, IonChip, IonIcon } from '@ionic/react';
import { locationOutline, heartOutline, closeOutline } from 'ionicons/icons';
import { useState } from 'react';

interface SwipeableCardProps {
  user: User;
  onSwipeLeft?: (userId: string) => void;
  onSwipeRight?: (userId: string) => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  user,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const { offset } = info;

    if (Math.abs(offset.x) > swipeThreshold) {
      if (offset.x > 0) {
        onSwipeRight?.(user.id);
      } else {
        onSwipeLeft?.(user.id);
      }
    }
  };

  const handleImageClick = () => {
    if (user.photos && user.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % user.photos.length);
    }
  };

  // 计算年龄
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // 获取位置文本
  const getLocationText = (): string => {
    if (!user.location) return '';
    
    if (typeof user.location === 'string') {
      return user.location;
    }
    
    return user.location.city ? `${user.location.city}, ${user.location.country}` : `${user.location.latitude}, ${user.location.longitude}`;
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="w-full h-full"
    >
      <IonCard className="w-full h-full m-0">
        <div className="relative w-full h-[70vh]">
          <IonImg
            src={user.photos && user.photos.length > 0 ? 
              (typeof user.photos[0] === 'string' ? user.photos[0] : user.photos[0].url) : 
              '/assets/default-avatar.png'}
            alt={user.name}
            className="w-full h-full object-cover"
            onClick={handleImageClick}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <IonCardTitle className="text-white text-2xl font-bold">
              {user.name}, {user.birthDate ? calculateAge(user.birthDate) : '?'}
            </IonCardTitle>
            <div className="flex items-center text-white mt-2">
              <IonIcon icon={locationOutline} className="mr-1" />
              <span>{getLocationText()}</span>
            </div>
          </div>
        </div>
        <IonCardContent>
          <p className="text-gray-700">{user.bio || ''}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {user.interests && user.interests.map((interest: string) => (
              <IonChip key={interest} color="primary">
                {interest}
              </IonChip>
            ))}
          </div>
        </IonCardContent>
      </IonCard>
    </motion.div>
  );
};