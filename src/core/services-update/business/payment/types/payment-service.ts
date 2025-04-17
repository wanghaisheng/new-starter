// 支付服务接口定义
export interface IPaymentService {
  initialize(): Promise<void>;
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  restorePurchases(): Promise<PurchaseResult[]>;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  [key: string]: any;
}

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  status: 'success'|'failed'|'pending';
  error?: string;
  [key: string]: any;
}

export interface Subscription {
  id: string;
  productId: string;
  status: 'active'|'expired'|'cancelled';
  expiresAt?: string;
  [key: string]: any;
}
