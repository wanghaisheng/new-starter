import { useState, useEffect, useCallback } from 'react';
import { AuthServiceFactory } from '@/core/services/auth-service';
import { AuthEventManager, AuthEventType, AuthEventData } from '@/core/services/auth-events';
import { User } from '@/core/lib/db/types/user';

/**
 * 认证状态
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 认证 Hook
 * 提供认证状态和操作方法
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const authService = AuthServiceFactory.getInstance().getAuthService();
  const eventManager = AuthEventManager.getInstance();
  
  // 更新认证状态
  const updateAuthState = useCallback(() => {
    const user = authService.getCurrentUser();
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false
    }));
  }, [authService]);
  
  // 初始化认证状态
  useEffect(() => {
    updateAuthState();
  }, [updateAuthState]);
  
  // 监听认证事件
  useEffect(() => {
    const handleAuthEvent = (eventType: AuthEventType, data: AuthEventData) => {
      switch (eventType) {
        case AuthEventType.LOGIN:
        case AuthEventType.REGISTER:
        case AuthEventType.PROFILE_UPDATED:
          setState(prev => ({
            ...prev,
            user: data.user,
            isAuthenticated: true,
            error: null
          }));
          break;
        case AuthEventType.LOGOUT:
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false
          }));
          break;
        case AuthEventType.ERROR:
          setState(prev => ({
            ...prev,
            error: data.error || new Error('Unknown error')
          }));
          break;
      }
    };
    
    // 监听所有认证事件
    eventManager.addEventListener(AuthEventType.AUTH_STATE_CHANGED, handleAuthEvent);
    
    return () => {
      eventManager.removeEventListener(AuthEventType.AUTH_STATE_CHANGED, handleAuthEvent);
    };
  }, [eventManager]);
  
  // 登录方法
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.login(email, password);
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false
      }));
      return user;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authService]);
  
  // 手机号登录方法
  const loginWithPhone = useCallback(async (phoneNumber: string, verificationCode: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.loginWithPhone(phoneNumber, verificationCode);
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false
      }));
      return user;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authService]);
  
  // 发送验证码方法
  const sendVerificationCode = useCallback(async (phoneNumber: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.sendVerificationCode(phoneNumber);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authService]);
  
  // 登出方法
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.logout();
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authService]);
  
  // 更新用户资料方法
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const updatedUser = await authService.updateProfile(userData);
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false
      }));
      return updatedUser;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authService]);
  
  return {
    ...state,
    login,
    loginWithPhone,
    sendVerificationCode,
    logout,
    updateProfile
  };
} 