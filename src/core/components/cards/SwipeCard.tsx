// SwipeCard: 卡片滑动组件，迁移自 mobile/components/cards/SwipeCard.tsx
'use client';
import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { User } from '@/core/lib/db/types/user';

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

  // Get the profile image with fallback
  const profileImage = user.photos && user.photos.length > 0
    ? (typeof user.photos[0] === 'string' ? user.photos[0] : '/default-avatar.jpg')
    : '/default-avatar.jpg';

  // Handle location which might be a string or an object
  const locationText = typeof user.location === 'string'
    ? user.location
    : `${user.location?.latitude}, ${user.location?.longitude}`;

  return (
    <motion.div
      className="relative w-full max-w-xs mx-auto"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== null ? { x: exitX } : {}}
    >
      <div className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900">
        <img
          src={profileImage}
          alt={user.name}
          className="w-full h-60 object-cover"
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200/60 dark:bg-slate-800/60">
            <span className="text-slate-400">加载中...</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg">{user.name}</span>
            <span className="text-sm text-slate-400">{user.age}岁</span>
          </div>
          <div className="text-xs text-slate-400 mb-2">{locationText}</div>
          <p className="text-sm mb-3 text-neutral-700 dark:text-neutral-300">{user.bio || ''}</p>
          <div className="flex flex-wrap gap-2">
            {user.interests && user.interests.map((interest, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200 font-medium rounded-full text-xs px-2.5 py-1"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
