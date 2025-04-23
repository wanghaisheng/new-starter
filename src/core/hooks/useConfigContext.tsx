import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConfigRegistry } from '@/core/services/infrastructure/config/registry/config-registry';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

interface ConfigContextValue {
  config: Record<string, any>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ keys, children }: { keys: ConfigKey[]; children: ReactNode }) {
  const configService = ConfigRegistry.getInstance();
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    keys.forEach(key => {
      initial[key] = configService.get(key);
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 批量订阅
    const handlers: Record<string, (val: any) => void> = {};
    keys.forEach(key => {
      handlers[key] = (newVal: any) => setConfig(prev => ({ ...prev, [key]: newVal }));
      configService.subscribe(key, handlers[key]);
    });
    return () => {
      keys.forEach(key => configService.unsubscribe(key, handlers[key]));
    };
  }, [keys, configService]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await configService.refresh();
      const updated: Record<string, any> = {};
      keys.forEach(key => {
        updated[key] = configService.get(key);
      });
      setConfig(updated);
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
}

export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext must be used within a ConfigProvider');
  return ctx;
}
