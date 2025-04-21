import { PaymentService } from '@/core/services/business/payment/service/payment-service';

describe('PaymentService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new PaymentService('mock');
    expect(service).toBeDefined();
    await expect(service.initialize()).resolves.toBeUndefined();
    const products = await service.getProducts();
    expect(Array.isArray(products)).toBe(true);
    const purchaseResult = await service.purchase('mock');
    expect(purchaseResult).toBeDefined();
    const subs = await service.getActiveSubscriptions();
    expect(Array.isArray(subs)).toBe(true);
    const restored = await service.restorePurchases();
    expect(Array.isArray(restored)).toBe(true);
  });
});
