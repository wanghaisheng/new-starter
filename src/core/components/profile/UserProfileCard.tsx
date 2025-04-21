// UserProfileCard: 用户个人资料卡片，迁移自 mobile/components/profile/UserProfileCard.tsx
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

interface UserProfileCardProps {
  avatar: string;
  name: string;
  gender: string;
  birthday: string;
  location: string;
  bio?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ avatar, name, gender, birthday, location, bio }) => (
  <GlassCard className="flex flex-col items-center p-6 w-full max-w-xs">
    <img src={avatar} alt={name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-white/20" />
    <h2 className="text-xl font-bold mb-1">{name}</h2>
    <div className="text-slate-400 text-sm mb-2">{gender} · {birthday} · {location}</div>
    {bio && <div className="text-slate-300 text-sm mt-2 text-center">{bio}</div>}
  </GlassCard>
);

export default UserProfileCard;
