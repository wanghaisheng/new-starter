import { useState, useEffect, useCallback } from 'react';
import { AuthServiceFactory } from '@/core/services/auth/auth-service-factory';
import { AuthEventManager, AuthEventType, AuthEventData } from '@/core/services/auth/auth-events';
import { PhoneAuthCredentials, AuthProviderType } from '@/core/services/auth/auth-types';
import { User } from '@/core/lib/db/types/user';
import { getAuthConfig, isAuthMethodEnabled, getEnabledAuthMethods } from '@/core/services/auth/auth-config';

/**
 * 认证状态
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  enabledMethods: AuthProviderType[];
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
    error: null,
    enabledMethods: getEnabledAuthMethods()
  });
  
  const authProvider = AuthServiceFactory.getInstance().getProvider();
  const eventManager = AuthEventManager.getInstance();
  const authConfig = getAuthConfig();
  
  // 更新认证状态
  const updateAuthState = useCallback(async () => {
    try {
      const user = await authProvider.getCurrentUser();
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
    }
  }, [authProvider]);
  
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
  
  // 邮箱密码登录
  const login = useCallback(async (email: string, password: string) => {
    if (!isAuthMethodEnabled('emailAndPassword')) {
      throw new Error('邮箱登录方式未启用');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authProvider.signInWithEmail(email, password);
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
  }, [authProvider]);
  
  // 手机号登录
  const loginWithPhone = useCallback(async (phoneNumber: string, verificationCode: string) => {
    if (!isAuthMethodEnabled('phone')) {
      throw new Error('手机号登录方式未启用');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authProvider.signInWithPhone({
        phoneNumber,
        verificationCode
      });
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
  }, [authProvider]);
  
  // 发送验证码
  const sendVerificationCode = useCallback(async (phoneNumber: string) => {
    if (!isAuthMethodEnabled('phone')) {
      throw new Error('手机号登录方式未启用');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authProvider.sendPhoneVerificationCode(phoneNumber);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
      throw error;
    }
  }, [authProvider]);
  
  // 社交账号登录
  const loginWithProvider = useCallback(async (provider: AuthProviderType) => {
    if (!isAuthMethodEnabled(provider)) {
      throw new Error(`${provider}登录方式未启用`);
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authProvider.signInWithProvider(provider);
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
  }, [authProvider]);
  
  // 登出
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authProvider.signOut();
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
  }, [authProvider]);
  
  // 更新用户资料
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const updatedUser = await authProvider.updateProfile(userData);
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
  }, [authProvider]);
  
  return {
    ...state,
    login,
    loginWithPhone,
    sendVerificationCode,
    loginWithProvider,
    logout,
    updateProfile,
    authConfig
  };
} 