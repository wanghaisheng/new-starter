// 微信支付适配器（伪代码，需对接微信 JSAPI/H5 支付）
import { IPaymentAdapter, Product, PurchaseResult, Subscription } from '../../../types/payment-service';

export class WechatPaymentService implements IPaymentAdapter {
  async initialize() {
    // 可选：初始化微信 JSAPI
  }
  async getProducts(): Promise<Product[]> {
    // 调用后端 API 获取微信支付商品
    const resp = await fetch('/api/payment/wechat/products');
    return await resp.json();
  }
  async purchase(productId: string): Promise<PurchaseResult> {
    // 调用后端获取预支付单，拉起微信支付
    const resp = await fetch('/api/payment/wechat/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    const data = await resp.json();
    // 此处应调起微信支付 JSAPI
    // wx.chooseWXPay({ ...data });
    return { productId, transactionId: data.transactionId, status: data.success ? 'success' : 'failed', error: data.error };
  }
  async getActiveSubscriptions(): Promise<Subscription[]> {
    const resp = await fetch('/api/payment/wechat/subscriptions');
    return await resp.json();
  }
  async restorePurchases(): Promise<PurchaseResult[]> {
    // 微信支付通常不支持恢复购买，返回空数组
    return [];
  }
  setConfig?(config: Record<string, any>) {
    // 可选扩展
  }
}
