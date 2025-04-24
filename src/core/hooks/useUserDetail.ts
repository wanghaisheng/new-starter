import { useState, useEffect, useCallback, useRef } from 'react';
import { UserServiceRegistry } from '@/core/services/business/user/registry/user-service-registry';
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
  const serviceRef = useRef<IUserService | null>(null);

  useEffect(() => {
    // 统一通过 Registry 获取服务实例，参数类型安全
    const allowedTypes = ['mock', 'remote', 'hybrid'] as const;
    type UserServiceType = typeof allowedTypes[number];
    const envType = process.env.NEXT_PUBLIC_USER_SERVICE_TYPE;
    const type: UserServiceType = allowedTypes.includes(envType as UserServiceType)
      ? (envType as UserServiceType)
      : (process.env.NODE_ENV === 'development' ? 'mock' : 'remote');
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    const provider = UserServiceRegistry.getProvider(type, apiBaseUrl, 'default');
    serviceRef.current = provider ? provider() : null;
    if (userId) fetchUserDetail(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserDetail = useCallback(async (uid: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getUserById(uid);
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
  }, [triggerToast]);

  const updateUserDetail = useCallback(async (uid: string, updates: Partial<User>) => {
    setLoading(true);
    setUpdateError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      await serviceRef.current.updateUser(uid, updates);
      triggerToast('用户资料已更新');
      await fetchUserDetail(uid);
    } catch (err) {
      setUpdateError(err as Error);
      triggerToast((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [triggerToast, fetchUserDetail]);

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
