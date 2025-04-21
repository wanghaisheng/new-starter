// 支付服务工厂（插件式注册表友好实现）
import { IPaymentService } from '../types/payment-service';
import { RevenueCatPaymentService } from '../adapters/in-app/revenuecat/revenuecat-payment-service';
import { CapacitorPurchasesPaymentService } from '../adapters/in-app/capacitor-purchases-payment-service';
import { StripePaymentService } from '../adapters/web/stripe/stripe-payment-service';
import { WechatPaymentService } from '../adapters/web/wechat/wechat-payment-service';
import { MockPaymentService } from '../adapters/mock-payment-service';

export type PaymentServiceType = 'revenuecat' | 'capacitor-purchases' | 'stripe' | 'wechat' | 'mock' | string;

export function createPaymentService(type: PaymentServiceType = 'revenuecat'): IPaymentService {
  switch(type) {
    case 'mock':
      return new MockPaymentService();
    case 'capacitor-purchases':
      return new CapacitorPurchasesPaymentService();
    case 'stripe':
      return new StripePaymentService();
    case 'wechat':
      return new WechatPaymentService();
    case 'revenuecat':
    default:
      return new RevenueCatPaymentService();
  }
}
