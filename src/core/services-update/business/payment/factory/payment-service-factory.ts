// 支付服务工厂
import { IPaymentService } from '../types/payment-service';
import { RevenueCatPaymentService } from '../adapters/in-app/revenuecat/revenuecat-payment-service';
// 可扩展更多适配器

export function createPaymentService(type: 'revenuecat' = 'revenuecat'): IPaymentService {
  switch(type) {
    case 'revenuecat':
    default:
      return new RevenueCatPaymentService();
  }
}
