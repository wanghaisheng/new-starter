import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getConfigService } from '@/core/services/infrastructure/config';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

export interface ConfigProviderProps {
  keys?: ConfigKey[];
  providerType?: string;
  children: React.ReactNode;
}

interface ConfigContextValue {
  config: Record<string, any>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  get: (key: ConfigKey) => any;
  set: (key: ConfigKey, value: any) => void;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ keys = [], providerType = 'default', children }) => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const listenersRef = useRef<Map<string, (val: any) => void>>(new Map());
  const [configService, setConfigService] = useState<any>(null);

  // 初始化时直接获取全局单例 configService
  useEffect(() => {
    try {
      setConfigService(getConfigService());
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  useEffect(() => {
    if (!configService || !keys.length) return;
    keys.forEach(key => {
      const handler = (val: any) => {
        setConfig(prev => ({ ...prev, [key]: val }));
      };
      listenersRef.current.set(key, handler);
      configService.subscribe(key, handler);
      // 初始赋值
      setConfig(prev => ({ ...prev, [key]: configService.get(key) }));
    });
    return () => {
      keys.forEach(key => {
        const handler = listenersRef.current.get(key);
        if (handler) configService.unsubscribe(key, handler);
      });
      listenersRef.current.clear();
    };
  }, [configService, JSON.stringify(keys)]);

  const refresh = async () => {
    if (!configService) return;
    setLoading(true);
    setError(null);
    try {
      if (typeof configService.refresh === 'function') {
        await configService.refresh();
      }
      const obj: Record<string, any> = {};
      keys.forEach(key => {
        obj[key] = configService.get(key);
      });
      setConfig(obj);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const get = (key: ConfigKey) => configService?.get(key);
  const set = (key: ConfigKey, value: any) => configService?.set(key, value);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refresh, get, set }}>
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext 必须在 ConfigProvider 内使用');
  return ctx;
}
