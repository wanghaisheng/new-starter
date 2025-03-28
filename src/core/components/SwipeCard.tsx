'use client';

import React, { useState } from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonSpinner } from '@ionic/react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { User } from '@/core/models/user';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipe }) => {
  const [exitX, setExitX] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(1000);
      onSwipe('right');
    } else if (info.offset.x < -100) {
      setExitX(-1000);
      onSwipe('left');
    }
  };

  // Get the profile image with fallback
  const profileImage = user.photos?.[0] || '/default-avatar.jpg';
  
  // Handle location which might be a string or an object
  const locationText = typeof user.location === 'string' 
    ? user.location 
    : `${user.location?.latitude}, ${user.location?.longitude}`;

  return (
    <motion.div
      style={{ 
        x, 
        rotate, 
        opacity,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 10
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX || 0 }}
      transition={{ duration: 0.5 }}
    >
      <IonCard className="h-full m-0 overflow-hidden">
        <div className="relative h-4/5">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <IonSpinner name="crescent" />
            </div>
          )}
          <IonImg 
            src={profileImage} 
            className="w-full h-full object-cover" 
            onIonImgDidLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)} // 即使加载失败也标记为已加载
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <h2 className="text-2xl font-bold">{user.name}, {user.age}</h2>
            <p className="text-sm">{locationText}</p>
          </div>
        </div>
        <IonCardContent className="h-1/5 overflow-y-auto">
          <p className="text-sm mb-2">{user.bio}</p>
          <div className="flex flex-wrap gap-1">
            {user.interests.map((interest, index) => (
              <IonChip key={index} className="bg-primary-100 text-primary-800">
                <IonLabel>{interest}</IonLabel>
              </IonChip>
            ))}
          </div>
        </IonCardContent>
      </IonCard>
    </motion.div>
  );
};