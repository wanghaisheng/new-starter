import { useCallback, useRef, useState } from 'react';
import type { Product, PurchaseResult, Subscription, IPaymentService } from '@/core/services/business/payment/types/payment-service';
import { PaymentServiceRegistry } from '@/core/services/business/payment/registry/payment-service-registry';

// 支持环境变量自动适配不同支付服务类型（如 revenuecat/capacitor-purchases/stripe/wechat）
const getPaymentServiceType = () => {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_PAYMENT_SERVICE_TYPE as 'revenuecat' | 'capacitor-purchases' | 'stripe' | 'wechat' | undefined
    ) || 'revenuecat';
  }
  return 'revenuecat';
};

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [fetchProductsError, setFetchProductsError] = useState<Error | null>(null);
  const [fetchSubscriptionsError, setFetchSubscriptionsError] = useState<Error | null>(null);
  const [purchaseError, setPurchaseError] = useState<Error | null>(null);
  const [restoreError, setRestoreError] = useState<Error | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [empty, setEmpty] = useState(false);

  // 统一通过 PaymentServiceRegistry 获取服务实例
  const serviceRef = useRef<IPaymentService>();
  if (!serviceRef.current) {
    serviceRef.current = PaymentServiceRegistry.getInstance().createService(getPaymentServiceType());
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchProductsError(null);
    try {
      if (!serviceRef.current) throw new Error('支付服务未初始化');
      const list = await serviceRef.current.getProducts();
      setProducts(list);
      setEmpty(list.length === 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取产品失败');
      setFetchProductsError(error);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setFetchSubscriptionsError(null);
    try {
      if (!serviceRef.current) throw new Error('支付服务未初始化');
      const subs = await serviceRef.current.getActiveSubscriptions();
      setSubscriptions(subs);
      setEmpty(subs.length === 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取订阅失败');
      setFetchSubscriptionsError(error);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchase = useCallback(async (productId: string) => {
    setLoading(true);
    setPurchaseError(null);
    try {
      if (!serviceRef.current) throw new Error('支付服务未初始化');
      const result = await serviceRef.current.purchase(productId);
      setPurchaseResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('购买失败');
      setPurchaseError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setLoading(true);
    setRestoreError(null);
    try {
      if (!serviceRef.current) throw new Error('支付服务未初始化');
      await serviceRef.current.restorePurchases();
      // 可根据需要刷新 subscriptions
      await fetchSubscriptions();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('恢复购买失败');
      setRestoreError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions]);

  return {
    loading,
    fetchProductsError,
    fetchSubscriptionsError,
    purchaseError,
    restoreError,
    products,
    subscriptions,
    purchaseResult,
    empty,
    fetchProducts,
    fetchSubscriptions,
    purchase,
    restorePurchases,
  };
}
