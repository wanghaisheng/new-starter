# 支付服务设计指南

## 概述

支付服务是 HeyTCM 的核心组件之一，采用适配器模式设计，实现了业务逻辑与具体支付实现的解耦。这种设计带来以下核心优势：

1. **统一的支付接口**
   - 所有支付方式（Web、App内购）使用相同的服务接口
   - 业务代码无需关心具体实现
   - 保持接口一致性

2. **灵活的支付支持**
   - 支持多种Web支付方式
   - 支持App内购
   - 支持订阅管理

3. **统一的配置管理**
   - 集中管理支付配置
   - 环境感知配置
   - 支付状态管理

4. **安全性**
   - 支付数据加密
   - 交易验证
   - 风险控制

## 架构设计

### 核心组件

1. **支付服务接口 (IPaymentService)**
   - 定义支付服务的基本行为
   - 包含各种支付能力的方法
   - 所有支付服务必须实现此接口

2. **支付服务适配器**
   - 实现特定支付服务的具体逻辑
   - 支持多种实现方式：
     - Web支付适配器：用于Web支付处理
     - App内购适配器：用于App内购处理
     - 订阅适配器：用于订阅管理

3. **支付服务工厂**
   - 负责创建支付服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **支付服务注册表**
   - 管理支付服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 目录结构

```
src/core/services-update/payment/
├── types/               # 支付服务类型
│   ├── payment-service.ts  # 支付服务接口
│   ├── web-payment.ts     # Web支付类型
│   ├── in-app-purchase.ts # App内购类型
│   ├── subscription.ts    # 订阅类型
│   └── transaction.ts     # 交易类型
├── adapters/            # 支付服务适配器
│   ├── web/             # Web支付适配器
│   │   ├── stripe/      # Stripe适配器
│   │   ├── paypal/      # PayPal适配器
│   │   ├── polar/       # Polar.sh适配器
│   │   ├── lemon/       # LemonSqueezy适配器
│   │   └── creem/       # Creem适配器
│   ├── in-app/          # App内购适配器
│   │   ├── google/      # Google Play适配器
│   │   └── apple/       # Apple IAP适配器
│   └── subscription/    # 订阅适配器
│       ├── stripe/      # Stripe订阅
│       ├── paypal/      # PayPal订阅
│       └── apple/       # Apple订阅
└── providers/           # 支付服务提供者
    ├── web-provider.ts     # Web支付提供者
    ├── in-app-provider.ts  # App内购提供者
    └── subscription-provider.ts # 订阅提供者
```

### 配置示例

```typescript
{
  "payment": {
    "type": "hybrid",
    "web": {
      "type": "stripe",
      "config": {
        "publishableKey": "...",
        "secretKey": "...",
        "webhookSecret": "...",
        "features": {
          "subscriptions": true,
          "oneTimePayments": true,
          "refunds": true
        }
      }
    },
    "inApp": {
      "type": "hybrid",
      "google": {
        "serviceAccount": "path/to/service-account.json",
        "products": ["premium", "pro"]
      },
      "apple": {
        "sharedSecret": "...",
        "products": ["premium", "pro"]
      }
    },
    "subscription": {
      "type": "stripe",
      "config": {
        "plans": {
          "basic": {
            "price": 9.99,
            "interval": "month",
            "features": ["feature1", "feature2"]
          },
          "pro": {
            "price": 19.99,
            "interval": "month",
            "features": ["feature1", "feature2", "feature3"]
          }
        }
      }
    }
  }
}
```

### 接口定义

```typescript
interface IPaymentService {
  // Web支付
  createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>;
  confirmPayment(paymentId: string): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<RefundResult>;
  
  // App内购
  getProducts(): Promise<Product[]>;
  purchaseProduct(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
  
  // 订阅管理
  createSubscription(planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Subscription>;
  updateSubscription(subscriptionId: string, planId: string): Promise<Subscription>;
  
  // 交易管理
  getTransactionHistory(options: TransactionQueryOptions): Promise<Transaction[]>;
  getTransactionDetails(transactionId: string): Promise<TransactionDetails>;
}

// 支付意图
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'processing' | 'succeeded' | 'failed';
  clientSecret: string;
  metadata?: Record<string, any>;
}

// 产品信息
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'consumable' | 'non-consumable' | 'subscription';
  features: string[];
}

// 订阅信息
interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
}
```

## 实现建议

### 1. Web支付处理

1. **支付流程**
   - 创建支付意图
   - 处理支付确认
   - 处理退款
   - 处理Webhook

2. **安全性**
   - 支付数据加密
   - 交易验证
   - 风险控制
   - 错误处理

3. **状态管理**
   - 支付状态追踪
   - 交易历史记录
   - 退款管理
   - 对账处理

### 2. App内购处理

1. **产品管理**
   - 产品配置
   - 价格管理
   - 功能关联
   - 本地化支持

2. **购买流程**
   - 购买验证
   - 收据处理
   - 恢复购买
   - 错误处理

3. **订阅管理**
   - 订阅状态
   - 续期处理
   - 取消处理
   - 升级降级

### 3. 订阅管理

1. **订阅计划**
   - 计划配置
   - 价格设置
   - 功能分配
   - 试用期管理

2. **订阅流程**
   - 订阅创建
   - 订阅更新
   - 订阅取消
   - 订阅恢复

3. **账单管理**
   - 账单生成
   - 支付处理
   - 发票管理
   - 退款处理

## 最佳实践

1. **安全性**
   - 使用HTTPS
   - 数据加密
   - 访问控制
   - 日志记录

2. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

3. **监控告警**
   - 支付监控
   - 交易监控
   - 性能监控
   - 错误监控

4. **测试策略**
   - 支付测试
   - 交易测试
   - 性能测试
   - 安全测试

## 示例

### 创建支付服务实例

```typescript
const config: PaymentConfig = {
  type: 'hybrid',
  web: {
    type: 'stripe',
    config: {
      publishableKey: '...',
      secretKey: '...'
    }
  }
};

const factory = PaymentServiceFactory.getInstance();
const service = factory.createService(config);
```

### 使用支付服务

```typescript
// 创建支付意图
const intent = await service.createPaymentIntent(1000, 'usd');

// 确认支付
const result = await service.confirmPayment(intent.id);

// 获取产品列表
const products = await service.getProducts();

// 购买产品
const purchase = await service.purchaseProduct(products[0].id);

// 创建订阅
const subscription = await service.createSubscription('pro');
```

## 注意事项

1. **配置管理**
   - 使用环境变量
   - 避免硬编码
   - 保护敏感信息
   - 版本控制

2. **安全性**
   - 支付数据加密
   - 交易验证
   - 风险控制
   - 合规性

3. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

4. **性能优化**
   - 请求优化
   - 缓存策略
   - 并发控制
   - 资源管理 