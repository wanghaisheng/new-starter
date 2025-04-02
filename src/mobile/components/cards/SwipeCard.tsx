'use client';

import React, { useState } from 'react';
import { IonCard, IonCardContent, IonImg, IonChip, IonLabel, IonSpinner } from '@ionic/react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { User } from '@/core/lib/db/models/user';

interface SwipeCardProps {
  user: User;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipe }) => {
  const [exitX, setExitX] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
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

  // Get the profile image with fallback
  const profileImage = user.photos && user.photos.length > 0 
    ? (typeof user.photos[0] === 'string' ? user.photos[0] : user.photos[0].url) 
    : '/default-avatar.jpg';
  
  // Handle location which might be a string or an object
  const locationText = typeof user.location === 'string' 
    ? user.location 
    : user.location?.city 
      ? `${user.location.city}, ${user.location.country}` 
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
      className="animate-fade-in"
    >
      <IonCard className="h-full m-0 overflow-hidden rounded-xl shadow-lg">
        <div className="relative h-4/5">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
              <IonSpinner name="crescent" color="primary" />
            </div>
          )}
          <IonImg 
            src={profileImage} 
            className="w-full h-full object-cover" 
            onIonImgDidLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            <h2 className="text-3xl font-bold mb-1">{user.name || 'User'}, {user.birthDate ? calculateAge(user.birthDate) : '?'}</h2>
            <p className="text-sm opacity-90 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locationText}
            </p>
          </div>
        </div>
        <IonCardContent className="h-1/5 overflow-y-auto px-5 py-4 bg-white dark:bg-neutral-800">
          <p className="text-sm mb-3 text-neutral-700 dark:text-neutral-300">{user.bio || ''}</p>
          <div className="flex flex-wrap gap-2">
            {user.interests && user.interests.map((interest, index) => (
              <IonChip 
                key={index} 
                className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 font-medium rounded-full text-xs px-2.5 py-1"
              >
                <IonLabel>{interest}</IonLabel>
              </IonChip>
            ))}
          </div>
        </IonCardContent>
      </IonCard>
    </motion.div>
  );
};