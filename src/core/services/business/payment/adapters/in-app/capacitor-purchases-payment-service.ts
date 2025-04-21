// Capacitor Purchases 支付适配器（集成 @revenuecat/purchases-capacitor 插件）
import { IPaymentAdapter, Product, PurchaseResult, Subscription } from '../../types/payment-service';
import { Purchases, PurchasesPackage, PurchasesStoreTransaction } from '@revenuecat/purchases-capacitor';

// CustomerInfo 类型按官方文档结构定义
interface CustomerInfo {
  entitlements: any;
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate: string | null;
  firstSeen: string;
  originalAppUserId: string;
  requestDate: string;
  allExpirationDates: { [key: string]: string | null };
  allPurchaseDates: { [key: string]: string | null };
  originalApplicationVersion: string | null;
  originalPurchaseDate: string | null;
  managementURL: string | null;
  nonSubscriptionTransactions: PurchasesStoreTransaction[];
  subscriptionsByProductIdentifier: { [key: string]: any };
}

// MakePurchaseResult 类型定义（根据官方类型定义修正 transactionId 字段）
interface MakePurchaseResult {
  productIdentifier: string;
  customerInfo: CustomerInfo;
  transactionId?: string;
}

// PurchasePackageOptions 类型
interface PurchasePackageOptions {
  aPackage: PurchasesPackage;
  googleProductChangeInfo?: any;
  googleIsPersonalizedPrice?: boolean;
}

export class CapacitorPurchasesPaymentService implements IPaymentAdapter {
  async initialize() {
    await Purchases.configure({ apiKey: 'YOUR_REVENUECAT_API_KEY' });
  }

  async getProducts(): Promise<Product[]> {
    const offerings = await Purchases.getOfferings();
    if (!offerings.current || !offerings.current.availablePackages) return [];
    return offerings.current.availablePackages.map((pkg: PurchasesPackage) => ({
      id: pkg.identifier,
      name: pkg.product.title,
      description: pkg.product.description,
      price: pkg.product.price,
      currency: pkg.product.currencyCode,
      _rawPackage: pkg, // 保留原始包对象便于后续购买
    }));
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    // 先获取商品包对象
    const offerings = await Purchases.getOfferings();
    const allPkgs = offerings.current?.availablePackages || [];
    const pkg = allPkgs.find((p: PurchasesPackage) => p.identifier === productId);
    if (!pkg) {
      return {
        productId,
        transactionId: '',
        status: 'failed',
        error: 'Product package not found',
      };
    }
    const options: PurchasePackageOptions = { aPackage: pkg };
    const result = await Purchases.purchasePackage(options) as unknown as MakePurchaseResult;
    return {
      productId: result.productIdentifier,
      transactionId: result.transactionId || '',
      status: 'success',
    };
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    const purchaserInfo = await Purchases.getCustomerInfo() as unknown as CustomerInfo;
    if (!purchaserInfo.activeSubscriptions) return [];
    return purchaserInfo.activeSubscriptions.map((sub: string) => ({
      id: sub,
      productId: sub,
      status: 'active',
    }));
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    const purchaserInfo = await Purchases.getCustomerInfo() as unknown as CustomerInfo;
    const result: PurchasesStoreTransaction[] = purchaserInfo.nonSubscriptionTransactions;
    if (!result) return [];
    return result.map((tx: PurchasesStoreTransaction) => ({
      productId: tx.productIdentifier,
      transactionId: tx.transactionIdentifier,
      status: 'success',
    }));
  }

  setConfig?(config: Record<string, any>) {}
}
