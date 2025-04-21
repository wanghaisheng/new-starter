import { PaymentService } from '@/core/services/business/payment/service/payment-service';
import { MockPaymentService } from '@/core/services/business/payment/adapters/mock-payment-service';

describe('PaymentService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new PaymentService(new MockPaymentService());
    expect(service).toBeDefined();
    if (service.getProducts) {
      const products = await service.getProducts();
      expect(Array.isArray(products)).toBe(true);
    }
    if (service.purchase) {
      await expect(service.purchase('product-id')).resolves.not.toThrow();
    }
    if (service.restorePurchases) {
      await expect(service.restorePurchases()).resolves.not.toThrow();
    }
  });
});
