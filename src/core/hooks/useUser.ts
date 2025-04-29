import { useState, useEffect, useCallback } from 'react';
import { useService } from '@/providers/ServiceProvider';
import type { User } from '@/core/lib/db/types/user.types';
import { useToast } from './useToast';
import type { IUserService } from '@/core/services/business/user/types/user-service';

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const { userService } = useService();

  useEffect(() => {
    if (userId) fetchUser(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUser = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!userService) throw new Error('服务未初始化');
      const data = await userService.getUserById(uid);
      setUser(data);
      setEmpty(!data);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取用户信息失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [triggerToast, userService]);

  // 用户信息更新
  const updateUser = useCallback(async (uid: string, updateData: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      if (!userService) throw new Error('服务未初始化');
      await userService.updateUser(uid, updateData);
      await fetchUser(uid);
    } catch (err: any) {
      setError({ type: 'update', message: err?.message || '更新用户信息失败' });
      triggerToast(err?.message || '更新用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [fetchUser, triggerToast, userService]);

  return { user, loading, error, empty, fetchUser, updateUser };
}