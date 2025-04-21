// 支付服务接口定义
export interface IPaymentService {
  initialize(): Promise<void>;
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  restorePurchases(): Promise<PurchaseResult[]>;
  /**
   * 新增：开通订阅（支持订阅型产品/会员）
   * @param planId 订阅方案ID
   */
  subscribe?(planId: string): Promise<Subscription>;
}

// 支付适配器接口定义（便于扩展和插件式注册）
export interface IPaymentAdapter extends IPaymentService {
  // 可扩展适配器独有的初始化/配置方法
  setConfig?(config: Record<string, any>): void;
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
