import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getConfigService } from '../core/services/infrastructure/config/registry/config-registry';
import type { ConfigKey } from '../core/services/infrastructure/config/config-keys';

export interface ConfigProviderProps {
  keys: ConfigKey[];
  providerType?: string;
  children: React.ReactNode;
}

interface ConfigContextValue {
  config: Record<string, any>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ keys, providerType = 'default', children }) => {
  const configService = getConfigService(providerType);
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const obj: Record<string, any> = {};
    keys.forEach(key => {
      obj[key] = configService.get(key);
    });
    return obj;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const listenersRef = useRef<Map<string, (val: any) => void>>(new Map());

  useEffect(() => {
    // 订阅所有 keys
    keys.forEach(key => {
      const handler = (val: any) => {
        setConfig(prev => ({ ...prev, [key]: val }));
      };
      listenersRef.current.set(key, handler);
      configService.subscribe(key, handler);
    });
    return () => {
      // 解绑所有 keys
      keys.forEach(key => {
        const handler = listenersRef.current.get(key);
        if (handler) configService.unsubscribe(key, handler);
      });
      listenersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(keys), providerType]);

  const refresh = async () => {
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
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigContext.Provider value={{ config, loading, error, refresh }}>
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext must be used within a ConfigProvider');
  return ctx;
}
