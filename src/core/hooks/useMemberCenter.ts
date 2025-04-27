import { useState, useEffect, useCallback } from 'react';
import { PaymentServiceRegistry } from '@/core/services/infrastructure/payment/registry/payment-service-registry';
import type { Subscription } from '@/core/lib/db/types/payment.types';
import { useToast } from './useToast';

export function useMemberCenter() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const { triggerToast } = useToast();

  // 通过 Registry 获取服务实例
  const service = PaymentServiceRegistry.getInstance().getDefaultService?.();

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!service || typeof service.getActiveSubscriptions !== 'function') throw new Error('支付服务未初始化或不支持查询');
      const result = await service.getActiveSubscriptions();
      setSubscriptions(result);
      setEmpty(result.length === 0);
      return result;
    } catch (e: any) {
      setError(e);
      setEmpty(true);
      triggerToast(e.message || '获取会员信息失败');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { subscriptions, loading, error, empty, fetchSubscriptions };
}
