import { useState, useEffect, useCallback } from 'react';
import { AuthServiceFactory } from '@/core/services/auth/auth-service-factory';
import { AuthEventManager, AuthEventType, AuthEventData } from '@/core/services/auth/auth-events';
import { PhoneAuthCredentials, AuthProviderType, AuthSession, getUserFromSession } from '@/core/services/auth/auth-types';
import { User } from '@/core/lib/db/types/user';
import { getAuthConfig, isAuthMethodEnabled, getEnabledAuthMethods } from '@/core/services/auth/auth-config';
import { useAuthStore } from '@/core/services/auth/auth-store';
import { AuthProvider } from '@/core/services/auth/auth-types';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authProvider, setAuthProvider] = useState<AuthProvider | null>(null);
  const enabledMethods = getEnabledAuthMethods();
  
  // 使用 Zustand store
  const { user, token, setUser, setToken, clearAuth } = useAuthStore();
  
  const eventManager = AuthEventManager.getInstance();
  const authConfig = getAuthConfig();
  
  // 初始化认证提供者
  useEffect(() => {
    const initProvider = async () => {
      try {
        const provider = await AuthServiceFactory.getInstance().getProvider();
        setAuthProvider(provider);
      } catch (error) {
        setError(error as Error);
        setIsLoading(false);
      }
    };
    initProvider();
  }, []);
  
  // 更新认证状态
  const updateAuthState = useCallback(async () => {
    if (!authProvider) return;
    
    try {
      setIsLoading(true);
      const currentUser = await authProvider.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser]);
  
  // 初始化认证状态
  useEffect(() => {
    if (authProvider) {
      updateAuthState();
    }
  }, [authProvider, updateAuthState]);
  
  // 监听认证事件
  useEffect(() => {
    if (!authProvider) return;
    
    const handleAuthEvent = (eventType: AuthEventType, data: AuthEventData) => {
      switch (eventType) {
        case AuthEventType.LOGIN:
        case AuthEventType.REGISTER:
        case AuthEventType.PROFILE_UPDATED:
          if (data.user) {
            setUser(data.user);
          }
          break;
        case AuthEventType.LOGOUT:
          clearAuth();
          break;
        case AuthEventType.ERROR:
          setError(data.error || new Error('Unknown error'));
          break;
      }
    };
    
    // 监听所有认证事件
    eventManager.addEventListener(AuthEventType.AUTH_STATE_CHANGED, handleAuthEvent);
    
    return () => {
      eventManager.removeEventListener(AuthEventType.AUTH_STATE_CHANGED, handleAuthEvent);
    };
  }, [eventManager, setUser, clearAuth, authProvider]);
  
  // 邮箱密码登录
  const login = useCallback(async (email: string, password: string) => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    if (!isAuthMethodEnabled('emailAndPassword')) {
      throw new Error('邮箱登录方式未启用');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const session = await authProvider.signInWithEmail(email, password);
      setUser(session.user);
      setToken(session.token);
      return session;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser, setToken]);
  
  // 手机号登录
  const loginWithPhone = useCallback(async (phoneNumber: string, verificationCode: string) => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    if (!isAuthMethodEnabled('phone')) {
      throw new Error('手机号登录方式未启用');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const session = await authProvider.signInWithPhone({
        phoneNumber,
        verificationCode
      });
      setUser(session.user);
      setToken(session.token);
      return session;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser, setToken]);
  
  // 发送验证码
  const sendVerificationCode = useCallback(async (phoneNumber: string) => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    if (!isAuthMethodEnabled('phone')) {
      throw new Error('手机号登录方式未启用');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await authProvider.sendPhoneVerificationCode(phoneNumber);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider]);
  
  // 社交账号登录
  const loginWithProvider = useCallback(async (provider: AuthProviderType) => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    if (!isAuthMethodEnabled(provider)) {
      throw new Error(`${provider}登录方式未启用`);
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const session = await authProvider.signInWithProvider(provider);
      setUser(session.user);
      setToken(session.token);
      return session;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser, setToken]);
  
  // 登出
  const logout = useCallback(async () => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    
    setIsLoading(true);
    setError(null);
    try {
      await authProvider.signOut();
      clearAuth();
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, clearAuth]);
  
  // 更新用户资料
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    if (!authProvider) throw new Error('认证提供者未初始化');
    
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authProvider.updateProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser]);
  
  return {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    enabledMethods,
    login,
    loginWithPhone,
    sendVerificationCode,
    loginWithProvider,
    logout,
    updateProfile,
    authConfig
  };
} 