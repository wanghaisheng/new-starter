import { useEffect, useState } from 'react';
import { configEventBus } from '@/core/services/infrastructure/config/events/config-events';
import { getConfigService } from '@/core/services/infrastructure/config/registry/config-registry';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

/**
 * useConfig
 * 统一响应式获取全局配置变量，支持 providerType 切换、自动监听变量变更（订阅）、loading/error/empty 状态、刷新。
 * @param key    可选，指定单个变量 key，返回该变量的实时值
 * @param providerType  provider 名称，默认 'default'（支持 env/mock/remote）
 * @returns { value, loading, error, empty, refresh }
 */
export function useConfig<K extends ConfigKey = ConfigKey>(key?: K, providerType: string = 'default') {
  const configService = getConfigService(providerType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [value, setValue] = useState<any>(() => (key ? configService.get(key) : undefined));
  const [empty, setEmpty] = useState<boolean>(false);

  useEffect(() => {
    if (!key) return;
    setValue(configService.get(key));
    setEmpty(configService.get(key) == null || configService.get(key) === '');
    // 订阅 configEventBus，provider 切换/全局变更均可响应
    const handler = (changedKey: string, newVal: any) => {
      if (changedKey === key) {
        setValue(newVal);
        setEmpty(newVal == null || newVal === '');
      }
    };
    configEventBus.on(key, handler);
    return () => configEventBus.off(key, handler);
  }, [key, providerType]);

  // 支持手动刷新（如远程配置变更）
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof configService.refresh === 'function') {
        await configService.refresh(key);
      }
      const v = key ? configService.get(key) : undefined;
      setValue(v);
      setEmpty(v == null || v === '');
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  if (key) {
    return { value, loading, error, empty, refresh };
  }
  // 若后续支持批量 keys，可拓展 context 方案
  return { value: undefined, loading: false, error: null, empty: true, refresh };
}
