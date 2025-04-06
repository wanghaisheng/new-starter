import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/core/services/data/user-service';
import type { User } from '@/core/lib/db/types';
import { useAuth } from './useAuth';

export interface UserState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

export function useUser() {
  const { user: authUser, isAuthenticated } = useAuth();
  const [state, setState] = useState<UserState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  const userService = UserService.getInstance();

  // 加载用户数据
  const loadUser = useCallback(async () => {
    if (!authUser) {
      setState(prev => ({ ...prev, loading: false, isAuthenticated: false }));
      return;
    }

    try {
      const user = await userService.getUserById(authUser.id);
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
        isAuthenticated: true
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to load user'),
        loading: false
      }));
    }
  }, [authUser, userService]);

  // 初始化加载用户数据
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // 更新用户数据
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) {
      throw new Error('No user to update');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const updatedUser = await userService.updateUser(state.user.id, updates);
      setState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false
      }));
      return updatedUser;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update user');
      setState(prev => ({
        ...prev,
        error,
        loading: false
      }));
      throw error;
    }
  }, [state.user, userService]);

  // 删除用户
  const deleteUser = useCallback(async () => {
    if (!state.user) {
      throw new Error('No user to delete');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await userService.deleteUser(state.user.id);
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        isAuthenticated: false
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete user');
      setState(prev => ({
        ...prev,
        error,
        loading: false
      }));
      throw error;
    }
  }, [state.user, userService]);

  return {
    ...state,
    updateUser,
    deleteUser,
    refresh: loadUser
  };
} 