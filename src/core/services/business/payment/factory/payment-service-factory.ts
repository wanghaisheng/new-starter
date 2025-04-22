// 支付服务工厂（统一命名与签名，推荐与其它业务一致）
import { IPaymentService } from '../types/payment-service';
import { RevenueCatPaymentService } from '../adapters/in-app/revenuecat/revenuecat-payment-service';
import { CapacitorPurchasesPaymentService } from '../adapters/in-app/capacitor-purchases-payment-service';
import { StripePaymentService } from '../adapters/web/stripe/stripe-payment-service';
import { WechatPaymentService } from '../adapters/web/wechat/wechat-payment-service';
import { MockPaymentService } from '../adapters/mock-payment-service';
import type { PaymentServiceType, PaymentServiceOptions } from '../registry/payment-service-registry';

export class PaymentServiceFactory {
  static createService(
    params: {
      type: PaymentServiceType;
      dataService?: any;
      options?: PaymentServiceOptions;
    }
  ): IPaymentService {
    const { type, dataService, options } = params;
    switch(type) {
      case 'mock':
        return new MockPaymentService(dataService, options);
      case 'capacitor-purchases':
        return new CapacitorPurchasesPaymentService(dataService, options);
      case 'stripe':
        return new StripePaymentService(dataService, options);
      case 'wechat':
        return new WechatPaymentService(dataService, options);
      case 'revenuecat':
      default:
        return new RevenueCatPaymentService(dataService, options);
    }
  }
}
