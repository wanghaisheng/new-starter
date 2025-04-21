# 推送服务设计指南

## 概述

推送服务是 HeyTCM 的核心组件之一，采用适配器模式设计，实现了业务逻辑与具体推送实现的解耦。这种设计带来以下核心优势：

1. **统一的推送接口**
   - 所有推送方式（Web、App）使用相同的服务接口
   - 业务代码无需关心具体实现
   - 保持接口一致性

2. **灵活的推送支持**
   - 支持Web推送
   - 支持App推送
   - 支持跨平台推送

3. **统一的配置管理**
   - 集中管理推送配置
   - 环境感知配置
   - 推送状态管理

4. **性能优化**
   - 消息队列
   - 批量发送
   - 推送优化
   - 资源管理

## 架构设计

### 核心组件

1. **推送服务接口 (IPushService)**
   - 定义推送服务的基本行为
   - 包含各种推送能力的方法
   - 所有推送服务必须实现此接口

2. **推送服务适配器**
   - 实现特定推送服务的具体逻辑
   - 支持多种实现方式：
     - Web推送适配器：用于Web推送处理
     - App推送适配器：用于App推送处理
     - 混合推送适配器：用于跨平台推送

3. **推送服务工厂**
   - 负责创建推送服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **推送服务注册表**
   - 管理推送服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 目录结构

```
src/core/services/push/
├── types/               # 推送服务类型
│   ├── push-service.ts  # 推送服务接口
│   ├── web-push.ts      # Web推送类型
│   ├── app-push.ts      # App推送类型
│   ├── message.ts       # 消息类型
│   └── notification.ts  # 通知类型
├── adapters/            # 推送服务适配器
│   ├── web/             # Web推送适配器
│   │   ├── firebase/    # Firebase适配器
│   │   └── onesignal/   # OneSignal适配器
│   ├── app/             # App推送适配器
│   │   ├── apple/       # Apple推送适配器
│   │   └── google/      # Google推送适配器
│   └── hybrid/          # 混合推送适配器
│       ├── firebase/    # Firebase混合推送
│       └── onesignal/   # OneSignal混合推送
└── providers/           # 推送服务提供者
    ├── web-provider.ts     # Web推送提供者
    ├── app-provider.ts     # App推送提供者
    └── hybrid-provider.ts  # 混合推送提供者
```

### 配置示例

```typescript
{
  "push": {
    "type": "hybrid",
    "web": {
      "type": "firebase",
      "config": {
        "apiKey": "...",
        "projectId": "...",
        "messagingSenderId": "...",
        "appId": "..."
      }
    },
    "app": {
      "ios": {
        "certificate": "path/to/cert.p12",
        "passphrase": "...",
        "bundleId": "..."
      },
      "android": {
        "serverKey": "...",
        "senderId": "...",
        "packageName": "..."
      }
    },
    "hybrid": {
      "type": "firebase",
      "config": {
        "apiKey": "...",
        "projectId": "...",
        "messagingSenderId": "...",
        "appId": "..."
      }
    }
  }
}
```

### 接口定义

```typescript
interface IPushService {
  // 设备注册
  registerDevice(device: DeviceInfo): Promise<DeviceToken>;
  unregisterDevice(deviceId: string): Promise<void>;
  
  // 消息发送
  sendMessage(message: PushMessage): Promise<PushResult>;
  sendMessages(messages: PushMessage[]): Promise<PushResult[]>;
  
  // 通知管理
  createNotification(notification: Notification): Promise<Notification>;
  updateNotification(notificationId: string, notification: Notification): Promise<Notification>;
  deleteNotification(notificationId: string): Promise<void>;
  
  // 统计查询
  getDeliveryStats(options: StatsQueryOptions): Promise<DeliveryStats>;
  getDeviceStats(options: StatsQueryOptions): Promise<DeviceStats>;
}

// 设备信息
interface DeviceInfo {
  id: string;
  type: 'web' | 'ios' | 'android';
  token: string;
  platform: string;
  version: string;
  metadata?: Record<string, any>;
}

// 推送消息
interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  collapseKey?: string;
  recipients: string[];
}

// 通知信息
interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  icon?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  schedule?: Date;
  repeat?: 'daily' | 'weekly' | 'monthly';
  status: 'scheduled' | 'sent' | 'failed';
  metadata?: Record<string, any>;
}
```

## 实现建议

### 1. Web推送处理

1. **设备注册**
   - 服务工作者注册
   - 订阅管理
   - 令牌管理
   - 错误处理

2. **消息发送**
   - 消息队列
   - 批量发送
   - 重试机制
   - 错误处理

3. **状态管理**
   - 推送状态追踪
   - 送达统计
   - 错误统计
   - 性能监控

### 2. App推送处理

1. **设备注册**
   - 设备令牌获取
   - 令牌更新
   - 设备信息管理
   - 错误处理

2. **消息发送**
   - 消息格式化
   - 平台特定处理
   - 重试机制
   - 错误处理

3. **通知管理**
   - 通知创建
   - 通知更新
   - 通知删除
   - 状态追踪

### 3. 混合推送处理

1. **设备管理**
   - 设备类型识别
   - 统一设备ID
   - 设备信息同步
   - 错误处理

2. **消息处理**
   - 消息转换
   - 平台适配
   - 批量处理
   - 错误处理

3. **统计管理**
   - 统一统计
   - 平台分析
   - 性能监控
   - 错误追踪

## 最佳实践

1. **性能优化**
   - 消息队列
   - 批量发送
   - 缓存策略
   - 资源管理

2. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

3. **监控告警**
   - 推送监控
   - 送达监控
   - 性能监控
   - 错误监控

4. **测试策略**
   - 推送测试
   - 设备测试
   - 性能测试
   - 安全测试

## 示例

### 创建推送服务实例

```typescript
const config: PushConfig = {
  type: 'hybrid',
  web: {
    type: 'firebase',
    config: {
      apiKey: '...',
      projectId: '...'
    }
  }
};

const factory = PushServiceFactory.getInstance();
const service = factory.createService(config);
```

### 使用推送服务

```typescript
// 注册设备
const device = await service.registerDevice({
  id: 'device-1',
  type: 'web',
  token: '...',
  platform: 'chrome',
  version: '1.0.0'
});

// 发送消息
const result = await service.sendMessage({
  title: 'Hello',
  body: 'World',
  recipients: ['device-1']
});

// 创建通知
const notification = await service.createNotification({
  title: 'Scheduled',
  body: 'Notification',
  schedule: new Date('2024-01-01'),
  recipients: ['device-1']
});
```

## 注意事项

1. **配置管理**
   - 使用环境变量
   - 避免硬编码
   - 保护敏感信息
   - 版本控制

2. **性能优化**
   - 消息队列
   - 批量发送
   - 缓存策略
   - 资源管理

3. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

4. **安全性**
   - 设备认证
   - 消息加密
   - 访问控制
   - 日志记录 