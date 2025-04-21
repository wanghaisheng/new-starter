import { useState, useCallback } from 'react';
import { PaymentServiceRegistry } from '@/core/services/business/payment/registry/payment-service-registry';
import type { PurchaseResult } from '@/core/services/business/payment/types/payment-service';
import { useToast } from './useToast';

export function useRestorePurchases() {
  const [restored, setRestored] = useState<PurchaseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();

  const service = PaymentServiceRegistry.getInstance().getDefaultService?.();

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!service || typeof service.restorePurchases !== 'function') throw new Error('支付服务未初始化或不支持恢复');
      const result = await service.restorePurchases();
      setRestored(result);
      setEmpty(result.length === 0);
      triggerToast('恢复购买成功');
      return result;
    } catch (e: any) {
      setError(e);
      setEmpty(true);
      triggerToast(e.message || '恢复购买失败');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return { restored, loading, error, empty, restore };
}
