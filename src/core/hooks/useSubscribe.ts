import { useState, useCallback } from 'react';
import { PaymentServiceRegistry } from '@/core/services/business/payment/registry/payment-service-registry';
import { useToast } from './useToast';
import type { Subscription } from '@/core/services/business/payment/types/payment-service';

export function useSubscribe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [empty, setEmpty] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { triggerToast } = useToast();

  // 通过 Registry 获取服务实例，禁止 Factory 直连
  const service = PaymentServiceRegistry.getInstance().getDefaultService?.();

  const subscribe = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!service || typeof service.subscribe !== 'function') throw new Error('支付服务未初始化或不支持订阅');
      const result = await service.subscribe(planId);
      setSubscription(result);
      triggerToast('开通成功');
      setEmpty(false);
      return result;
    } catch (e: any) {
      setError(e);
      setEmpty(true);
      triggerToast(e.message || '开通失败');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [service, triggerToast]);

  return { subscription, loading, error, empty, subscribe };
}
