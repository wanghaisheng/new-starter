# 消息服务设计指南

## 概述

消息服务是 HeyTCM 的核心组件之一，采用适配器模式设计，实现了业务逻辑与具体消息实现的解耦。这种设计带来以下核心优势：

1. **统一的消息接口**
   - 所有消息类型（实时、聊天）使用相同的服务接口
   - 业务代码无需关心具体实现
   - 保持接口一致性

2. **灵活的消息支持**
   - 支持实时消息
   - 支持聊天功能
   - 支持跨平台消息

3. **统一的配置管理**
   - 集中管理消息配置
   - 环境感知配置
   - 消息状态管理

4. **性能优化**
   - 消息队列
   - 批量处理
   - 离线支持
   - 资源管理

## 架构设计

### 核心组件

1. **消息服务接口 (IMessagingService)**
   - 定义消息服务的基本行为
   - 包含各种消息能力的方法
   - 所有消息服务必须实现此接口

2. **消息服务适配器**
   - 实现特定消息服务的具体逻辑
   - 支持多种实现方式：
     - 实时消息适配器：用于实时消息处理
     - 聊天适配器：用于聊天功能处理
     - 混合适配器：用于跨平台消息

3. **消息服务工厂**
   - 负责创建消息服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **消息服务注册表**
   - 管理消息服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 目录结构

```
src/core/services/messaging/
├── types/               # 消息服务类型
│   ├── messaging-service.ts  # 消息服务接口
│   ├── realtime.ts      # 实时消息类型
│   ├── chat.ts          # 聊天类型
│   ├── message.ts       # 消息类型
│   └── channel.ts       # 频道类型
├── adapters/            # 消息服务适配器
│   ├── realtime/        # 实时消息适配器
│   │   ├── firebase/    # Firebase适配器
│   │   └── pusher/      # Pusher适配器
│   ├── chat/            # 聊天适配器
│   │   ├── sendbird/    # SendBird适配器
│   │   └── stream/      # Stream适配器
│   └── hybrid/          # 混合适配器
│       ├── firebase/    # Firebase混合消息
│       └── pusher/      # Pusher混合消息
└── providers/           # 消息服务提供者
    ├── realtime-provider.ts  # 实时消息提供者
    ├── chat-provider.ts      # 聊天提供者
    └── hybrid-provider.ts    # 混合提供者
```

### 配置示例

```typescript
{
  "messaging": {
    "type": "hybrid",
    "realtime": {
      "type": "firebase",
      "config": {
        "apiKey": "...",
        "projectId": "...",
        "messagingSenderId": "...",
        "appId": "..."
      }
    },
    "chat": {
      "type": "sendbird",
      "config": {
        "appId": "...",
        "apiToken": "...",
        "features": {
          "groupChat": true,
          "fileSharing": true,
          "typingIndicator": true
        }
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
interface IMessagingService {
  // 实时消息
  subscribe(channel: string, callback: MessageCallback): Promise<Subscription>;
  unsubscribe(subscription: Subscription): Promise<void>;
  publish(channel: string, message: Message): Promise<void>;
  
  // 聊天功能
  createChannel(channel: Channel): Promise<Channel>;
  joinChannel(channelId: string, userId: string): Promise<void>;
  leaveChannel(channelId: string, userId: string): Promise<void>;
  sendMessage(channelId: string, message: Message): Promise<Message>;
  
  // 消息管理
  getMessageHistory(channelId: string, options: HistoryOptions): Promise<Message[]>;
  deleteMessage(messageId: string): Promise<void>;
  updateMessage(messageId: string, content: string): Promise<Message>;
  
  // 用户管理
  getUserStatus(userId: string): Promise<UserStatus>;
  updateUserStatus(userId: string, status: UserStatus): Promise<void>;
  getOnlineUsers(channelId: string): Promise<User[]>;
}

// 消息类型
interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 频道类型
interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'group';
  members: string[];
  createdBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// 用户状态
interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  deviceInfo?: DeviceInfo;
}
```

## 实现建议

### 1. 实时消息处理

1. **消息订阅**
   - 频道管理
   - 订阅状态
   - 消息过滤
   - 错误处理

2. **消息发布**
   - 消息队列
   - 批量处理
   - 重试机制
   - 错误处理

3. **状态管理**
   - 连接状态
   - 消息状态
   - 错误统计
   - 性能监控

### 2. 聊天功能处理

1. **频道管理**
   - 频道创建
   - 成员管理
   - 权限控制
   - 错误处理

2. **消息处理**
   - 消息发送
   - 消息接收
   - 消息存储
   - 错误处理

3. **用户管理**
   - 用户状态
   - 在线状态
   - 设备信息
   - 错误处理

### 3. 混合消息处理

1. **消息转换**
   - 格式转换
   - 协议适配
   - 数据同步
   - 错误处理

2. **状态同步**
   - 用户状态
   - 消息状态
   - 频道状态
   - 错误处理

3. **性能优化**
   - 消息缓存
   - 批量处理
   - 资源管理
   - 错误处理

## 最佳实践

1. **性能优化**
   - 消息队列
   - 批量处理
   - 缓存策略
   - 资源管理

2. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

3. **监控告警**
   - 消息监控
   - 状态监控
   - 性能监控
   - 错误监控

4. **测试策略**
   - 消息测试
   - 状态测试
   - 性能测试
   - 安全测试

## 示例

### 创建消息服务实例

```typescript
const config: MessagingConfig = {
  type: 'hybrid',
  realtime: {
    type: 'firebase',
    config: {
      apiKey: '...',
      projectId: '...'
    }
  }
};

const factory = MessagingServiceFactory.getInstance();
const service = factory.createService(config);
```

### 使用消息服务

```typescript
// 订阅频道
const subscription = await service.subscribe('channel-1', (message) => {
  console.log('Received message:', message);
});

// 发送消息
await service.publish('channel-1', {
  content: 'Hello World',
  type: 'text'
});

// 创建聊天频道
const channel = await service.createChannel({
  name: 'General Chat',
  type: 'public',
  members: ['user-1', 'user-2']
});

// 发送聊天消息
const message = await service.sendMessage(channel.id, {
  content: 'Hello everyone!',
  type: 'text'
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
   - 批量处理
   - 缓存策略
   - 资源管理

3. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复策略

4. **安全性**
   - 消息加密
   - 访问控制
   - 用户认证
   - 日志记录 