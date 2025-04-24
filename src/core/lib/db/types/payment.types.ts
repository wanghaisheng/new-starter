// 支付相关主类型定义，供全局 service/hook/页面层复用

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
  status: 'success' | 'failed' | 'pending';
  error?: string;
  [key: string]: any;
}

export interface Subscription {
  id: string;
  productId: string;
  status: 'active' | 'expired' | 'cancelled';
  expiresAt?: string;
  [key: string]: any;
}

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  [key: string]: any;
}