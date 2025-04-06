import { useState, useEffect, useCallback } from 'react';
import { NetworkService } from '@/core/services/network-service';
import { DataServiceFactory } from '@/core/services/data-service-factory';

export interface UseApiOptions {
  immediate?: boolean;
  offlineFirst?: boolean;
  useHybridClient?: boolean;
  retries?: number;
  retryDelay?: number;
  cacheDuration?: number;
}

export interface UseApiResult<T, R = T> {
  data: R | null;
  loading: boolean;
  error: Error | null;
  networkStatus: 'online' | 'offline' | 'limited';
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
    cacheDuration = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'limited'>(
    NetworkService.getInstance().getConnectionStatus()
  );

  // 监听网络状态变化
  useEffect(() => {
    const networkService = NetworkService.getInstance();
    const listenerId = networkService.addNetworkStatusListener(() => {
      setNetworkStatus(networkService.getConnectionStatus());
    });

    // 配置数据服务
    if (useHybridClient) {
      DataServiceFactory.setUseHybridClient(true);
    }
    if (offlineFirst) {
      DataServiceFactory.getOfflineModeService();
    }

    return () => {
      networkService.removeNetworkStatusListener(listenerId);
    };
  }, [useHybridClient, offlineFirst]);

  const execute = useCallback(
    async <U = T>(apiFunction: () => Promise<U>): Promise<U> => {
      setLoading(true);
      setError(null);

      let attempt = 0;
      const maxAttempts = retries + 1;

      while (attempt < maxAttempts) {
        try {
          const result = await apiFunction();
          if (result === data) {
            setData(result as T);
          }
          setLoading(false);
          return result;
        } catch (err) {
          attempt++;
          
          if (attempt === maxAttempts) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            setLoading(false);
            throw error;
          }

          // 如果还有重试次数，等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      // TypeScript需要这个返回语句，但实际上永远不会执行到这里
      throw new Error('Unexpected execution path');
    },
    [data, retries, retryDelay]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (data) {
      await execute(defaultFunction);
    }
  }, [data, execute, defaultFunction]);

  // 如果设置了immediate，组件挂载时执行
  useEffect(() => {
    if (immediate) {
      execute(defaultFunction);
    }
  }, [immediate, execute, defaultFunction]);

  return {
    data,
    loading,
    error,
    networkStatus,
    execute,
    reset,
    refresh
  };
} 