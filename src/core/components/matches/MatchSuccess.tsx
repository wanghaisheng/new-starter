// MatchSuccess: 匹配成功组件，迁移自 mobile/components/matches/MatchSuccess.tsx
import React from 'react';
import { GlassCard } from '@/core/components/ui/GlassCard';

interface MatchSuccessProps {
  avatarA: string;
  nameA: string;
  avatarB: string;
  nameB: string;
  onStartChat: () => void;
}

const MatchSuccess: React.FC<MatchSuccessProps> = ({ avatarA, nameA, avatarB, nameB, onStartChat }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <GlassCard className="flex flex-col items-center p-8 max-w-md w-full">
      <div className="flex items-center gap-6 mb-6">
        <img src={avatarA} alt={nameA} className="w-20 h-20 rounded-full object-cover border-4 border-pink-400" />
        <span className="text-3xl font-bold text-pink-500">❤</span>
        <img src={avatarB} alt={nameB} className="w-20 h-20 rounded-full object-cover border-4 border-pink-400" />
      </div>
      <h2 className="text-xl font-bold mb-2 text-center">{nameA} 与 {nameB} 配对成功！</h2>
      <button onClick={onStartChat} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium transition-all">开始聊天</button>
    </GlassCard>
  </div>
);

export default MatchSuccess;
