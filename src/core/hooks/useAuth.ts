import { useState, useEffect, useCallback } from 'react';
import { AuthServiceFactory } from '@/core/services/infrastructure/auth/factory/auth-service-factory';
import { AuthEventManager, AuthEventData } from '@/core/services/infrastructure/auth/factory/auth-events';
import { useAuthStore } from '@/core/store/auth-store';
import type { IAuthService, AuthUser, AuthResult } from '@/core/services/infrastructure/auth/types/auth-service';
import { useToast } from './useToast';

/**
 * 认证状态
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  enabledMethods: string[];
  empty: boolean;
  loading: boolean;
}

/**
 * 认证 Hook
 * 提供认证状态、认证方法与统一异常提示
 */
export interface UseAuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  error: Error | null;
  enabledMethods: string[];
  empty: boolean;
  login: (providerType: 'google' | 'apple' | 'wechat' | 'email' | 'phone', credentials: any) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [authProvider, setAuthProvider] = useState<IAuthService | null>(null);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();
  // 使用 auth-store
  const { user, token, setUser, setToken, clearAuth } = useAuthStore();
  const eventManager = AuthEventManager.getInstance();

  // 初始化认证提供者
  useEffect(() => {
    const initProvider = async () => {
      try {
        const rawType = process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE;
        let type: 'mock'|'firebase'|'better'|'hybrid' = 'mock';
        if (rawType === 'firebase' || rawType === 'better' || rawType === 'hybrid') {
          type = rawType;
        } else {
          type = 'mock';
        }
        console.log('[DEBUG][useAuth] 当前 auth 类型:', type, '环境变量:', process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE);
        // 工厂/适配器模式，便于 mock/remote 切换
        const provider = AuthServiceFactory.createService(type);
        setAuthProvider(provider);
        // 获取支持的认证方式
        if (provider && typeof (provider as any).getEnabledMethods === 'function') {
          (provider as any).getEnabledMethods().then(setEnabledMethods).catch(() => setEnabledMethods([]));
        }
      } catch (error) {
        setError(error as Error);
        setIsLoading(false);
        setEmpty(true);
        setEnabledMethods([]);
        triggerToast((error as Error).message || '认证服务初始化失败');
      }
    };
    initProvider();
  }, [triggerToast]);

  // 更新认证状态
  const updateAuthState = useCallback(async () => {
    if (!authProvider) {
      setEmpty(true);
      return;
    }
    try {
      setIsLoading(true);
      const currentUser = await (authProvider as any).getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setEmpty(false);
      } else {
        setEmpty(true);
      }
    } catch (error) {
      setError(error as Error);
      setEmpty(true);
      triggerToast((error as Error).message || '获取认证状态失败');
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, setUser, triggerToast]);

  // 初始化认证状态
  useEffect(() => {
    if (authProvider) {
      updateAuthState();
    } else {
      setEmpty(true);
    }
  }, [authProvider, updateAuthState]);

  // ===================== 修正事件监听和数据结构 =====================
  // 事件类型常量
  const AUTH_EVENT_LOGIN = 'login';
  const AUTH_EVENT_LOGOUT = 'logout';
  const AUTH_EVENT_ERROR = 'error';

  // 事件回调函数，useCallback 保证引用稳定
  const handleAuthEvent = useCallback((data: { type: string; payload?: any }) => {
    switch (data.type) {
      case AUTH_EVENT_LOGIN:
        setUser(data.payload?.user as AuthUser);
        setEmpty(false);
        triggerToast('登录成功');
        break;
      case AUTH_EVENT_LOGOUT:
        clearAuth();
        setEmpty(true);
        triggerToast('已登出');
        break;
      case AUTH_EVENT_ERROR: {
        const err = data.payload?.error;
        setError(typeof err === 'string' ? new Error(err) : (err instanceof Error ? err : new Error('认证异常')));
        triggerToast((err && err.message) || String(err) || '认证异常');
        break;
      }
      default:
        break;
    }
  }, [setUser, setEmpty, triggerToast, clearAuth, setError]);

  // 监听认证事件
  useEffect(() => {
    if (!authProvider) return;
    eventManager.subscribe(handleAuthEvent);
    return () => {
      eventManager.unsubscribe(handleAuthEvent);
    };
  }, [authProvider, eventManager, handleAuthEvent]);
  // ===================== END 修正 =====================

  const allowedProviders = ['google', 'apple', 'wechat'] as const;
  type ProviderType = typeof allowedProviders[number];

  // 通用登录
  const login = useCallback(async (providerType: ProviderType | 'email' | 'phone', credentials: any): Promise<AuthResult> => {
    setLoading(true);
    setError(null);
    if (!authProvider) throw new Error('认证服务未初始化');
    try {
      let result: AuthResult;
      if (providerType === 'email') {
        result = await (authProvider as any).loginWithEmail(credentials.email, credentials.password);
      } else if (providerType === 'phone') {
        result = await (authProvider as any).loginWithPhone(credentials.phone, credentials.code);
      } else if (allowedProviders.includes(providerType)) {
        result = await (authProvider as any).loginWithProvider(providerType, credentials.token);
      } else {
        throw new Error('不支持的第三方登录类型');
      }
      setUser(result.user);
      setToken(result.token);
      triggerToast('登录成功');
      return result;
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [authProvider, setUser, setToken, triggerToast]);

  // Google 登录快捷方法
  const loginWithGoogle = useCallback(async () => {
    return login('google', {});
  }, [login]);

  // 登出
  const logout = useCallback(async () => {
    if (!authProvider) throw new Error('认证服务未初始化');
    setIsLoading(true);
    setError(null);
    try {
      await (authProvider as any).logout();
      clearAuth();
      triggerToast('已登出');
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider, clearAuth, triggerToast]);

  // 刷新 token
  const refreshToken = useCallback(async () => {
    if (!authProvider) throw new Error('认证服务未初始化');
    try {
      await (authProvider as any).refreshToken();
      triggerToast('Token 已刷新');
      await updateAuthState();
    } catch (e: any) {
      setError(e);
      throw e;
    }
  }, [authProvider, updateAuthState, triggerToast]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    loading,
    error,
    enabledMethods,
    empty,
    login,
    loginWithGoogle,
    logout,
    refreshToken,
  };
}