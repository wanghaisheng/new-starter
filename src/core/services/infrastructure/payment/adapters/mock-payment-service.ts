import { IPaymentService, Product, PurchaseResult, Subscription } from '../types/payment-service';

export class MockPaymentService implements IPaymentService {
  async initialize() { return; }
  async getProducts(): Promise<Product[]> {
    return [{ id: 'mock', name: 'Mock Product', price: 0 } as Product];
  }
  async purchase(productId: string): Promise<PurchaseResult> {
    return { success: true, productId } as PurchaseResult;
  }
  async getActiveSubscriptions(): Promise<Subscription[]> {
    return [{ id: 'mock', productId: 'mock', status: 'active' } as Subscription];
  }
  async restorePurchases(): Promise<PurchaseResult[]> {
    return [{ success: true, productId: 'mock' } as PurchaseResult];
  }
}
