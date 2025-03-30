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
    setCurrentImageIndex((prev) => (prev + 1) % user.images.length);
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
            src={user.images[currentImageIndex]}
            alt={user.name}
            className="w-full h-full object-cover"
            onClick={handleImageClick}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <IonCardTitle className="text-white text-2xl font-bold">
              {user.name}, {user.age}
            </IonCardTitle>
            <div className="flex items-center text-white mt-2">
              <IonIcon icon={locationOutline} className="mr-1" />
              <span>{user.location}</span>
            </div>
          </div>
        </div>
        <IonCardContent>
          <p className="text-gray-700">{user.bio}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {user.interests.map((interest: string) => (
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