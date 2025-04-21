import { useState, useEffect, useCallback } from 'react';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import { DataServiceFactory } from '@core/services/data/factory/data-service-factory';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export interface UseApiOptions {
  immediate?: boolean;
  offlineFirst?: boolean;
  useHybridClient?: boolean;
  retries?: number;
  retryDelay?: number;
  cacheDuration?: number;
  requireAuth?: boolean;
}

export interface UseApiResult<T, R = T> {
  data: R | null;
  loading: boolean;
  fetchError: Error | null;
  networkStatus: 'online' | 'offline';
  execute: <U = T>(apiFunction: () => Promise<U>) => Promise<U>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useApi<T>(
  defaultFunction: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    immediate = false,
    offlineFirst = false,
    useHybridClient = false,
    retries = 3,
    retryDelay = 1000,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    requireAuth = false
  } = options;

  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // 使用 NetworkManager 统一管理网络状态
  const networkManager = getNetworkManager();
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>(
    networkManager.isConnected() ? 'online' : 'offline'
  );
  const { triggerToast } = useToast();

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    networkManager.onConnect(handleOnline);
    networkManager.onDisconnect(handleOffline);
    return () => {
      networkManager.offConnect(handleOnline);
      networkManager.offDisconnect(handleOffline);
    };
  }, [networkManager]);

  // 配置数据服务 - 按需动态选择适配器
  // 如需动态切换数据服务，可在此处调用 DataServiceFactory.createService 传递 config
  // 例如：
  // const dataService = DataServiceFactory.createService({ services: { data: { adapter: useHybridClient ? 'hybrid' : offlineFirst ? 'indexeddb' : 'mock', options: {} } } });
  // 若只需用默认环境变量推断，可省略

  const execute = useCallback(async <U = T>(apiFunction: () => Promise<U>): Promise<U> => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await apiFunction();
      setData(result as any);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setFetchError(errorObj);
      triggerToast(errorObj.message);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  const reset = useCallback(() => {
    setData(null);
    setFetchError(null);
  }, []);

  const refresh = useCallback(async () => {
    await execute(defaultFunction);
  }, [execute, defaultFunction]);

  useEffect(() => {
    if (immediate && (!requireAuth || isAuthenticated)) {
      execute(defaultFunction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, requireAuth, isAuthenticated]);

  return {
    data,
    loading,
    fetchError,
    networkStatus,
    execute,
    reset,
    refresh,
  };
}