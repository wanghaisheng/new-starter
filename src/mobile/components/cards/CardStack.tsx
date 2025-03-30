import { useState } from 'react';
import { SwipeCard } from '@/mobile/components/cards/SwipeCard';
import { User } from '@/core/models/user';
import { getRecommendedUsers } from '@/core/models/mock-data';

export const CardStack: React.FC = () => {
  const [currentUserId] = useState('1'); // In a real app, this would come from auth
  const [users, setUsers] = useState<User[]>(() => getRecommendedUsers(currentUserId));

  const handleSwipe = (userId: string, direction: 'left' | 'right') => {
    console.log(`Swiped ${direction} on user:`, userId);
    if (direction === 'right') {
      // Here you would typically create a match
    }
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-gray-500">没有更多推荐了</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {users.map((user, index) => (
        <div
          key={user.id}
          className="absolute w-full h-full"
          style={{
            zIndex: users.length - index,
            transform: `scale(${1 - index * 0.05})`,
          }}
        >
          <SwipeCard
            user={user}
            onSwipe={(direction) => handleSwipe(user.id, direction)}
          />
        </div>
      ))}
    </div>
  );
};