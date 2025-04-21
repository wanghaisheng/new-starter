import { useCallback, useMemo } from 'react';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { getTranslationsByKeys } from '@/core/services/business/translation/translation-service';

/**
 * useTranslations - 全局内容多语言 hook
 * @param keys 支持单个 key 或 key 数组
 * @param locale 当前语言（如 'zh', 'en'）。如不传自动取全局/默认。
 * @returns { loading, error, empty, data, get, fetch } - data 为 { [key]: value } 映射
 */
export function useTranslations(keys: string | string[], locale?: string) {
  const {
    loading,
    error,
    data,
    run: fetchTranslations
  } = useAsyncAction(async (params: { keys: string[]; locale?: string }) => {
    return getTranslationsByKeys(params.keys, params.locale);
  });

  // 自动拉取
  const fetch = useCallback(() => {
    fetchTranslations({ keys: Array.isArray(keys) ? keys : [keys], locale });
  }, [keys, locale, fetchTranslations]);

  // empty 状态
  const empty = useMemo(() => {
    if (!data) return false;
    const arr = Array.isArray(keys) ? keys : [keys];
    return arr.every(k => !data[k]);
  }, [data, keys]);

  // error 结构细化
  const errorObj = useMemo(() => {
    if (!error) return null;
    if (typeof error === 'object' && 'type' in error) return error;
    return { type: 'unknown', message: error instanceof Error ? error.message : String(error) };
  }, [error]);

  // 提供 get 方法便于手动获取
  const get = useCallback(
    (key: string) => (data && data[key]) || '',
    [data]
  );

  return {
    loading,
    error: errorObj,
    empty,
    data, // { [key]: value }
    get,
    fetch // 可手动触发
  };
}
