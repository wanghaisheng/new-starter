import { PaymentService } from '@/core/services/business/payment/service/payment-service';
import { MockPaymentService } from '@/core/services/business/payment/adapters/mock-payment-service';

describe('PaymentService 单元测试', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService(new MockPaymentService());
  });

  it('getProducts: 应能获取商品列表', async () => {
    const products = await service.getProducts();
    expect(Array.isArray(products)).toBe(true);
  });

  it('purchase: 应能购买商品', async () => {
    await expect(service.purchase('product-id')).resolves.not.toThrow();
  });

  it('restorePurchases: 应能恢复购买', async () => {
    await expect(service.restorePurchases()).resolves.not.toThrow();
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    const errorAdapter = {
      getProducts: () => { throw new Error('fail'); },
      purchase: () => { throw new Error('fail'); },
      restorePurchases: () => { throw new Error('fail'); },
    };
    const errorService = new PaymentService(errorAdapter as any);
    await expect(errorService.getProducts()).rejects.toThrow('fail');
    await expect(errorService.purchase('id')).rejects.toThrow('fail');
    await expect(errorService.restorePurchases()).rejects.toThrow('fail');
  });
});
