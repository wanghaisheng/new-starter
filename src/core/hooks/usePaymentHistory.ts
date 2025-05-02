import { useState, useCallback } from 'react';
import { usePaymentService } from '@/providers/ServiceProvider';
import type { PurchaseResult } from '@/core/lib/db/types/payment.types';
import { useToast } from './useToast';

export function usePaymentHistory() {
  const [history, setHistory] = useState<PurchaseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();

  // 使用ServiceProvider获取服务实例
  const service = usePaymentService();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!service || typeof service.restorePurchases !== 'function') throw new Error('支付服务未初始化或不支持查询');
      const result = await service.restorePurchases();
      setHistory(result);
      setEmpty(result.length === 0);
      return result;
    } catch (e: any) {
      setError(e);
      setEmpty(true);
      triggerToast(e.message || '获取支付历史失败');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return { history, loading, error, empty, fetchHistory };
}
