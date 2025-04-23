import { useEffect, useState } from 'react';
import { ConfigRegistry } from '@/core/services/infrastructure/config/registry/config-registry';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

/**
 * useConfig
 * 响应式获取全局配置变量，支持自动监听变量变更（订阅）。
 * @param key 可选，指定单个变量 key，返回该变量的实时值
 * @returns { value, loading, error, refresh } 或 { config, loading, error, refresh }
 */
export function useConfig<K extends ConfigKey = ConfigKey>(key?: K) {
  const configService = ConfigRegistry.getInstance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [value, setValue] = useState<any>(() => (key ? configService.get(key) : undefined));
  const [config, setConfig] = useState<any>(() => (!key ? configService : undefined));

  useEffect(() => {
    if (!key) return;
    const handler = (newVal: any) => setValue(newVal);
    configService.subscribe(key, handler);
    return () => configService.unsubscribe(key, handler);
  }, [key, configService]);

  // 支持手动刷新（如远程配置变更）
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await configService.refresh();
      if (key) setValue(configService.get(key));
      else setConfig(configService);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  if (key) {
    return { value, loading, error, refresh };
  }
  // 返回整个 configService 实例（兼容老用法）
  return { config, loading, error, refresh };
}
