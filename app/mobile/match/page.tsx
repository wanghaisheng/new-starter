'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/common/GlassCard';
import { MatchCard } from '@/mobile/components/match/MatchCard';
import { User } from '@/core/lib/db/types';
import { MatchService } from '@/core/services/match-service';

export default function MatchPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const service = MatchService.getInstance();
        const results = await service.findMatches();
        setMatches(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('加载匹配结果失败'));
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const handleLike = async (userId: string) => {
    try {
      const service = MatchService.getInstance();
      await service.likeUser(userId);
      // 更新匹配列表
      setMatches(matches.filter(match => match.id !== userId));
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleDislike = async (userId: string) => {
    try {
      const service = MatchService.getInstance();
      await service.dislikeUser(userId);
      // 更新匹配列表
      setMatches(matches.filter(match => match.id !== userId));
    } catch (err) {
      console.error('不喜欢失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500 text-lg">
            加载失败: {error.message}
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-lg">没有更多匹配了</div>
        </div>
      </div>
    );
  }

  const currentMatch = matches[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 p-4">
      <div className="max-w-md mx-auto">
        <GlassCard className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-300"
            >
              返回
            </button>
            <h1 className="text-xl font-bold text-white">发现</h1>
            <div className="w-8" /> {/* 占位符，保持标题居中 */}
          </div>

          <MatchCard
            user={currentMatch}
            onLike={() => handleLike(currentMatch.id)}
            onDislike={() => handleDislike(currentMatch.id)}
          />
        </GlassCard>
      </div>
    </div>
  );
} 