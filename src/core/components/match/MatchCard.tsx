// MatchCard: 匹配卡片组件，迁移自 mobile/components/match/MatchCard.tsx
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

interface MatchCardProps {
  avatar: string;
  name: string;
  age: number;
  desc?: string;
  onLike: () => void;
  onPass: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ avatar, name, age, desc, onLike, onPass }) => (
  <GlassCard className="flex flex-col items-center p-6 w-full max-w-xs">
    <img src={avatar} alt={name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-white/20" />
    <h2 className="text-xl font-bold mb-1">{name}</h2>
    <div className="text-slate-400 text-sm mb-2">{age} 岁</div>
    {desc && <div className="text-slate-300 text-sm mb-4 text-center">{desc}</div>}
    <div className="flex gap-4 mt-2">
      <button onClick={onPass} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-full">跳过</button>
      <button onClick={onLike} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full">喜欢</button>
    </div>
  </GlassCard>
);

export default MatchCard;
