import { useState, useEffect, useCallback, useRef } from 'react';
import { UserServiceRegistry } from '@/core/services/business/user/registry/user-service-registry';
import type { User } from '@/core/lib/db/types/user';
import { useToast } from './useToast';
import type { IUserService } from '@/core/services/business/user/types/user-service';

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { type: string; message: string }>(null);
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
    if (userId) fetchUser(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUser = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      const data = await serviceRef.current.getUserById(uid);
      setUser(data);
      setEmpty(!data);
    } catch (err: any) {
      setError({ type: 'fetch', message: err?.message || '获取用户信息失败' });
      setEmpty(true);
      triggerToast(err?.message || '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  // 用户信息更新
  const updateUser = useCallback(async (uid: string, updateData: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      if (!serviceRef.current) throw new Error('服务未初始化');
      await serviceRef.current.updateUser(uid, updateData);
      await fetchUser(uid);
    } catch (err: any) {
      setError({ type: 'update', message: err?.message || '更新用户信息失败' });
      triggerToast(err?.message || '更新用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [fetchUser, triggerToast]);

  return { user, loading, error, empty, fetchUser, updateUser };
}