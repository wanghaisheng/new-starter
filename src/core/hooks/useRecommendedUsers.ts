import { useState, useEffect, useRef } from 'react';
import { useService } from '@/providers/ServiceProvider';
import type { User } from '@/core/lib/db/types/user.types';
import { useToast } from './useToast';

function isProfileCompleted(user: User | null): boolean {
  return !!(user && user.name && user.birthDate && user.gender && user.photos && user.photos.length > 0);
}
function isQuizCompleted(user: User | null): boolean {
  // 这里假设 quiz 结果保存在 profile.quizResult 或 profile.quizCompleted
  return !!(user && user.profile && (user.profile.quizResult || user.profile.quizCompleted));
}
function isMatchPreferenceSet(user: User | null): boolean {
  return !!(user && user.preferences && Object.keys(user.preferences).length > 0);
}

/**
 * 推荐用户列表 hook：根据当前用户状态自动切换推荐池（调用 MatchService 推荐算法）
 */
export function useRecommendedUsers(currentUser: User | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const { matchService } = useService();
  const matchServiceRef = useRef<any>(matchService);

  useEffect(() => {
    matchServiceRef.current = matchService;
    fetchRecommendedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchRecommendedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!matchServiceRef.current) throw new Error('服务未初始化');
      let data: User[] = [];
      if (!currentUser || !isProfileCompleted(currentUser) || !isQuizCompleted(currentUser) || !isMatchPreferenceSet(currentUser)) {
        // 新用户或未完善资料，走随机推荐
        data = await matchServiceRef.current.matchUsers(currentUser?.id || '', { useRandom: true, limit: 20 }, undefined);
      } else {
        // 已完善资料，按偏好/AI推荐
        data = await matchServiceRef.current.matchUsers(currentUser.id, { limit: 20 }, undefined);
      }
      setUsers(data);
      setEmpty(!data || data.length === 0);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取推荐用户失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取推荐用户失败');
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, empty, refresh: fetchRecommendedUsers };
}
