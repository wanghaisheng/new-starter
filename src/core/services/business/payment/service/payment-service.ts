// 支付服务业务层，聚合调用适配器
import { IPaymentService, Product, PurchaseResult, Subscription } from '../types/payment-service';
import { createPaymentService } from '../factory/payment-service-factory';
import type { PaymentServiceType } from '../factory/payment-service-factory';

export class PaymentService {
  private adapter: IPaymentService;

  constructor(type: PaymentServiceType = 'revenuecat') {
    this.adapter = createPaymentService(type);
  }

  async initialize() { await this.adapter.initialize(); }
  async getProducts(): Promise<Product[]> { return this.adapter.getProducts(); }
  async purchase(productId: string): Promise<PurchaseResult> { return this.adapter.purchase(productId); }
  async getActiveSubscriptions(): Promise<Subscription[]> { return this.adapter.getActiveSubscriptions(); }
  async restorePurchases(): Promise<PurchaseResult[]> { return this.adapter.restorePurchases(); }
}
