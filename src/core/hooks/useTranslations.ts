import { useCallback, useMemo } from 'react';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { TranslationServiceRegistry } from '@/core/services/infrastructure/translation/registry/translation-service-registry';

/**
 * useTranslations - 全局内容多语言 hook
 * @param keys 支持单个 key 或 key 数组
 * @param locale 当前语言（如 'zh', 'en'）。如不传自动取全局/默认。
 * @returns { loading, error, empty, data, get, fetch } - data 为 { [key]: value } 映射
 */
export function useTranslations(keys: string | string[], locale?: string) {
  // 统一通过 Registry 获取服务实例
  const translationService = TranslationServiceRegistry.getInstance().getDefaultService();

  const {
    loading,
    actionError,
    result,
    run: fetchTranslations
  } = useAsyncAction(async (params: { keys: string[]; locale?: string }) => {
    // 通过服务实例获取翻译
    return translationService.getTranslationsByKeys(params.keys, params.locale);
  });

  // 自动拉取
  const fetch = useCallback(() => {
    fetchTranslations({ keys: Array.isArray(keys) ? keys : [keys], locale });
  }, [keys, locale, fetchTranslations]);

  // empty 状态
  const empty = useMemo(() => {
    if (!result) return false;
    const arr = Array.isArray(keys) ? keys : [keys];
    return arr.every(k => !result[k]);
  }, [result, keys]);

  // error 结构细化
  const errorObj = useMemo(() => {
    if (!actionError) return null;
    if (typeof actionError === 'object' && 'type' in actionError) return actionError;
    return { type: 'unknown', message: actionError instanceof Error ? actionError.message : String(actionError) };
  }, [actionError]);

  // 提供 get 方法便于手动获取
  const get = useCallback(
    (key: string) => (result && result[key]) || '',
    [result]
  );

  return {
    loading,
    error: errorObj,
    empty,
    data: result, // { [key]: value }
    get,
    fetch // 可手动触发
  };
}
