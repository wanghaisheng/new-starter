// Stripe 支付适配器（伪代码，需对接 Stripe API/SDK）
import { IPaymentService, Product, PurchaseResult, Subscription } from '../../../types/payment-service';

export class StripePaymentService implements IPaymentService {
  async initialize() {
    // 可选：初始化 Stripe SDK
  }
  async getProducts(): Promise<Product[]> {
    // 调用后端 API 获取 Stripe 商品
    const resp = await fetch('/api/payment/stripe/products');
    return await resp.json();
  }
  async purchase(productId: string): Promise<PurchaseResult> {
    // 跳转到 Stripe Checkout 或调用支付 API
    const resp = await fetch('/api/payment/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    return await resp.json();
  }
  async getActiveSubscriptions(): Promise<Subscription[]> {
    const resp = await fetch('/api/payment/stripe/subscriptions');
    return await resp.json();
  }
  async restorePurchases(): Promise<PurchaseResult[]> {
    // Stripe 通常不支持恢复购买，返回空数组
    return [];
  }
}
