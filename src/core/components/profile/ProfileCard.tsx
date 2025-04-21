// ProfileCard: 个人资料卡片，迁移自 mobile/components/profile/ProfileCard.tsx
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

interface ProfileCardProps {
  avatar: string;
  name: string;
  age: number;
  location: string;
  tags?: string[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ avatar, name, age, location, tags = [] }) => (
  <GlassCard className="flex flex-col items-center p-6 w-full max-w-xs">
    <img src={avatar} alt={name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-white/20" />
    <h2 className="text-xl font-bold mb-1">{name}</h2>
    <div className="text-slate-400 text-sm mb-2">{age} 岁 · {location}</div>
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map(tag => (
        <span key={tag} className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">{tag}</span>
      ))}
    </div>
  </GlassCard>
);

export default ProfileCard;
