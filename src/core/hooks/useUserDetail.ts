import { useState, useEffect, useCallback } from 'react';
import { useService } from '@/providers/ServiceProvider';
import type { IUserService } from '@/core/services/business/user/types/user-service';
import type { User } from '@/core/lib/db/types/user.types';
import { useToast } from './useToast';

export interface UseUserDetailResult {
  user: User | null;
  loading: boolean;
  fetchError: Error | null;
  updateError: Error | null;
  empty: boolean;
  fetchUserDetail: (userId: string) => Promise<void>;
  updateUserDetail: (userId: string, updates: Partial<User>) => Promise<void>;
}

export function useUserDetail(userId: string): UseUserDetailResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [updateError, setUpdateError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  const { userService } = useService();

  useEffect(() => {
    if (userId) fetchUserDetail(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserDetail = useCallback(async (uid: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      if (!userService) throw new Error('服务未初始化');
      const data = await userService.getUserById(uid);
      setUser(data);
      setEmpty(!data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取用户详情失败');
      setFetchError(error);
      setUser(null);
      setEmpty(true);
      triggerToast(error.message);
    } finally {
      setLoading(false);
    }
  }, [triggerToast, userService]);

  const updateUserDetail = useCallback(async (uid: string, updates: Partial<User>) => {
    setLoading(true);
    setUpdateError(null);
    try {
      if (!userService) throw new Error('服务未初始化');
      await userService.updateUser(uid, updates);
      triggerToast('用户资料已更新');
      await fetchUserDetail(uid);
    } catch (err) {
      setUpdateError(err as Error);
      triggerToast((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [triggerToast, fetchUserDetail, userService]);

  return {
    user,
    loading,
    fetchError,
    updateError,
    empty,
    fetchUserDetail,
    updateUserDetail,
  };
}
