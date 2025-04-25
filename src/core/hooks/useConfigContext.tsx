import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { configEventBus } from '@/core/services/infrastructure/config/events/config-events';
import { getConfigService } from '@/core/services/infrastructure/config/registry/config-registry';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

interface ConfigContextValue {
  config: Record<string, any>;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export function ConfigProvider({ keys, children }: { keys: ConfigKey[]; children: ReactNode }) {
  const configService = getConfigService();
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
    // 批量订阅 configEventBus
    const handlers: Record<string, (changedKey: string, val: any) => void> = {};
    keys.forEach(key => {
      handlers[key] = (changedKey, newVal) => {
        if (changedKey === key) setConfig(prev => ({ ...prev, [key]: newVal }));
      };
      configEventBus.on(key, handlers[key]);
    });
    return () => {
      keys.forEach(key => configEventBus.off(key, handlers[key]));
    };
  }, [keys]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof configService.refresh === 'function') {
        await configService.refresh();
      }
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
  if (!ctx) throw new Error('useConfigContext 必须在 <ConfigProvider> 内部使用');
  return ctx;
}
