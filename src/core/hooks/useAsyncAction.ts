import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options?: { onSuccess?: (result: Awaited<ReturnType<T>>) => void; onError?: (err: any) => void }
) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<T>> | null>(null);
  const { triggerToast } = useToast();

  // error 处理严格类型安全
  const safeSetActionError = (err: any) => {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    setActionError(errorObj);
    triggerToast(errorObj.message);
  };

  const run = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      setActionError(null);
      try {
        const res = await asyncFn(...args);
        setResult(res);
        options?.onSuccess?.(res);
        return res;
      } catch (err) {
        safeSetActionError(err);
        options?.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, options, triggerToast]
  );

  return { run, loading, actionError, result };
}
