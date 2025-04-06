# 核心服务层 (Core Services)

本目录包含应用程序的核心服务实现，采用离线优先的架构设计，支持在线和离线操作。服务层是应用程序的中枢，连接UI层与数据层，处理业务逻辑并管理数据流。

## 架构概览

我们的服务遵循分层方法：

```
UI组件层 (Components)
      ↓
服务层 (UserService, MessageService, 等)
      ↓
数据访问层 (DataServiceFactory → DatabaseService/MockDataService)
      ↓
存储层 (Repositories, SyncManager)
```

## 关键服务

### 数据访问服务

- **IDataService**: 定义数据服务的统一接口，所有数据服务都实现此接口
- **DatabaseService**: 主数据服务实现，提供对底层数据库的访问
- **MockDataService**: 为开发和测试提供模拟数据
- **DataServiceFactory**: 工厂类，根据环境选择合适的数据服务实现
- **OfflineStorageService**: 管理永不与服务器同步的离线数据
- **StorageService**: 提供本地和云端存储能力，支持不同环境下的数据存储

### 领域服务

- **UserService**: 处理用户相关操作
- **MessageService**: 管理用户间的消息操作
- **LocationService**: 提供位置相关功能，支持离线缓存
- **ValidationService**: 验证数据模型
- **NetworkService**: 监控网络状态并提供连接变化事件
- **AppService**: 管理应用全局状态和服务初始化

## 离线优先架构

我们的架构基于离线优先原则设计：

1. **本地优先存储**: 所有数据先存储在本地，使应用能在没有网络连接的情况下运行
2. **自动同步**: 在线时，数据会自动与服务器同步
3. **离线指示器**: UI组件显示数据等待同步状态
4. **冲突解决**: 使用预定义策略解决本地和远程数据之间的冲突
5. **离线专用存储**: 部分数据可标记为离线专用，永不与服务器同步

## 离线专用存储

我们架构的一个独特特性是支持离线专用存储，这允许开发者：

- 创建保证仅保留在设备上的表
- 存储不应发送到服务器的敏感或临时用户数据
- 实现完全离线操作的功能

### 使用离线专用存储

使用离线专用存储的方法：

1. 使用 `OfflineStorageService` 管理永不离开设备的数据
2. 使用常规数据服务管理最终需要同步的数据

示例：

```typescript
// 存储永不离开设备的用户偏好
const offlineStorage = OfflineStorageService.getInstance();
await offlineStorage.create('userPreferences', {
  id: 'pref_123',
  theme: 'dark',
  privacySettings: { shareLocation: false },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 服务工厂模式

我们使用工厂模式选择合适的数据服务实现：

```typescript
// 获取当前环境的合适数据服务
const dataService = DataServiceFactory.getDataService();

// 对于测试，可以覆盖默认行为
DataServiceFactory.setUseMockData(true);

// 获取离线模式的数据服务
const offlineDataService = DataServiceFactory.getOfflineModeService();

// 获取离线存储服务
const offlineStorageService = DataServiceFactory.getOfflineStorageService();
```

## 网络管理

`NetworkService` 提供网络连接的实时监控：

```typescript
const networkService = NetworkService.getInstance();

// 检查当前状态
if (networkService.isOnline()) {
  // 执行网络操作
}

// 监听变化
const listenerId = networkService.addNetworkStatusListener((status) => {
  if (status.connected) {
    console.log('恢复在线状态!');
  } else {
    console.log('连接断开');
  }
});

// 稍后，移除监听器
networkService.removeNetworkStatusListener(listenerId);
```

## 最佳实践

使用服务层时的最佳实践：

1. 始终在使用前初始化服务
2. 使用服务接口而不是具体实现
3. 在UI中处理在线和离线场景
4. 对于敏感数据，利用离线专用功能
5. 测试连接和断开状态

## 添加新服务

要添加新服务，请遵循以下步骤：

1. 在 `services` 目录下创建新服务文件，命名为 `*-service.ts`
2. 定义服务接口（可选但推荐）
3. 实现服务类，使用单例模式
4. 注册到 `AppService` 以便统一初始化（如需要）

示例：

```typescript
// notification-service.ts
export interface INotificationService {
  initialize(): Promise<void>;
  sendNotification(userId: string, message: string): Promise<void>;
  // ...其他方法
}

export class NotificationService implements INotificationService {
  private static instance: NotificationService;
  private _isInitialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;
    
    // 初始化逻辑...
    this._isInitialized = true;
  }
  
  // 实现其他方法...
}
```

## 处理数据库提供者变更

如果需要更改数据库提供者（例如从Firebase更改为Cloudflare D1或其他）：

1. 在 `lib/db/clients` 目录下创建新的数据库客户端适配器
2. 实现 `IDatabaseClient` 接口
3. 更新 `DatabaseFactory` 以支持新的数据库类型
4. 确保所有特定于数据库的代码都封装在适配器中

## 处理模式变更

如果表结构（schema）发生变化：

1. 更新 `lib/db/schema/definitions` 中的相应模式定义
2. 在 `lib/db/schema/versions.ts` 中创建新的版本迁移
3. 使用 `VersionManager` 管理版本迁移
4. 更新相关的数据模型和接口

迁移示例：

```typescript
// 在 versions.ts 中
export const databaseVersions: DatabaseVersion[] = [
  // ...现有版本
  {
    version: 3,
    migrations: [
      {
        name: 'add_status_to_user',
        up: async (client) => {
          // 迁移逻辑
          await client.executeRawQuery(
            'ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"'
          );
        }
      }
    ]
  }
];
```

## 服务方法的添加与扩展

向现有服务添加新方法时：

1. 首先更新服务接口（如果有）
2. 实现新方法，保持单一职责原则
3. 确保所有数据访问都通过数据服务层
4. 为新方法添加适当的文档注释
5. 添加单元测试以验证新功能

## 离线功能启用

当为功能启用离线支持时：

1. 确定数据是否应该:
   - 永久离线（使用 `OfflineStorageService`）
   - 在线后同步（使用常规数据服务配合 `SyncManager`）

2. 对于需要同步的数据:
   - 确保实体有正确的时间戳和状态标记
   - 在表模式中配置 `syncConfig` 选项
   - 处理可能的冲突情况

3. 使用 `NetworkService` 响应网络状态变化

示例配置同步：

```typescript
// 在模式定义中
const userSchema: TableSchema = {
  name: 'users',
  columns: [/* ... */],
  syncConfig: {
    priority: 1, // 同步优先级
    conflictStrategy: 'server-wins', // 冲突解决策略
    syncDirection: 'bidirectional' // 同步方向
  }
};
```

## 调试服务

服务层调试指南：

1. 使用 `DataServiceFactory.setUseMockData(true)` 切换到模拟数据
2. 检查 `localStorage` 中的数据存储（当使用本地存储时）
3. 监控网络请求和同步操作
4. 使用 `StorageService.getOfflineDataStats()` 检查离线数据状态
5. 在服务方法中添加适当的日志记录

## 认证服务

### 架构概述

认证服务采用工厂模式和提供者模式，支持多环境配置：

```
src/core/services/auth/
├── auth-service.ts          # 统一的认证服务接口
├── auth-service-factory.ts  # 认证服务工厂
├── firebase-auth-provider.ts # Firebase认证提供者
└── mock-auth-provider.ts    # 模拟认证提供者
```

### 环境配置

认证服务支持以下环境配置：

```bash
# .env.local
NEXT_PUBLIC_DATABASE_ENV=mock    # mock, local, production
NEXT_PUBLIC_MOCK_DB_TYPE=hybrid  # memory, json, hybrid
```

### 核心接口

#### AuthProvider 接口

```typescript
interface AuthProvider {
  initialize(): Promise<void>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken(): Promise<string>;
  resetPassword(email: string): Promise<void>;
  updateProfile(data: Partial<AuthUser>): Promise<AuthUser>;
}
```

#### AuthService 接口

```typescript
interface AuthService {
  initialize(): Promise<void>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken(): Promise<string>;
  resetPassword(email: string): Promise<void>;
  updateProfile(data: Partial<AuthUser>): Promise<AuthUser>;
}
```

### 使用示例

#### 初始化认证服务

```typescript
import { AuthService } from '@/core/services/auth/auth-service';

// 获取认证服务实例
const authService = AuthService.getInstance();

// 初始化认证服务
await authService.initialize();
```

#### 用户认证

```typescript
// 用户登录
const user = await authService.signIn('user@example.com', 'password');

// 获取当前用户
const currentUser = await authService.getCurrentUser();

// 更新用户资料
const updatedUser = await authService.updateProfile({
  displayName: 'New Name',
  photoURL: 'https://example.com/photo.jpg'
});

// 登出
await authService.signOut();
```

### 错误处理

认证服务使用统一的错误处理机制：

```typescript
try {
  await authService.signIn(email, password);
} catch (error) {
  if (error instanceof AuthError) {
    console.error('认证错误:', error.message);
    // 处理认证错误
  } else {
    console.error('未知错误:', error);
    // 处理其他错误
  }
}
```

### 日志记录

认证服务包含详细的日志记录：

```typescript
// 日志示例
logger.info('用户登录成功', { userId: user.id });
logger.error('认证失败', { error: error.message });
```

## 数据服务

### 架构概述

数据服务采用分层架构，支持多环境数据存储：

```
src/core/services/data/
├── data-service.ts          # 数据服务接口
├── data-service-factory.ts  # 数据服务工厂
├── database-service.ts      # 数据库服务实现
└── mock-data-service.ts     # 模拟数据服务
```

### 环境配置

数据服务支持以下环境配置：

```bash
# .env.local
NEXT_PUBLIC_DATABASE_ENV=mock    # mock, local, production
NEXT_PUBLIC_MOCK_DB_TYPE=hybrid  # memory, json, hybrid
```

### 核心接口

#### IDataService 接口

```typescript
interface IDataService {
  initialize(): Promise<void>;
  getClient(): IDatabaseClient;
  
  // 用户相关
  getUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserDTO): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // 其他方法...
}
```

### 使用示例

#### 初始化数据服务

```typescript
import { DataServiceFactory } from '@/core/services/data/data-service-factory';

// 获取数据服务实例
const dataService = DataServiceFactory.getInstance().getService();

// 初始化数据服务
await dataService.initialize();
```

#### 数据操作

```typescript
// 创建用户
const user = await dataService.createUser({
  email: 'user@example.com',
  name: 'Test User'
});

// 更新用户
const updatedUser = await dataService.updateUser(user.id, {
  name: 'Updated Name'
});

// 获取用户
const fetchedUser = await dataService.getUserById(user.id);
```

### 错误处理

数据服务使用统一的错误处理机制：

```typescript
try {
  await dataService.createUser(data);
} catch (error) {
  if (error instanceof ServiceError) {
    console.error('服务错误:', error.message);
    // 处理服务错误
  } else {
    console.error('未知错误:', error);
    // 处理其他错误
  }
}
```

### 日志记录

数据服务包含详细的日志记录：

```typescript
// 日志示例
logger.info('创建用户成功', { userId: user.id });
logger.error('数据操作失败', { error: error.message });
```

## 其他服务

### 用户服务

用户服务提供用户相关的业务逻辑：

```typescript
import { UserService } from '@/core/services/user-service';

const userService = UserService.getInstance();

// 获取用户资料
const profile = await userService.getUserProfile(userId);

// 更新用户设置
await userService.updateUserSettings(userId, settings);
```

### 消息服务

消息服务处理应用内的消息通信：

```typescript
import { MessageService } from '@/core/services/message-service';

const messageService = MessageService.getInstance();

// 发送消息
await messageService.sendMessage({
  from: userId,
  to: recipientId,
  content: 'Hello!'
});

// 获取消息历史
const messages = await messageService.getMessages(userId, recipientId);
```

## 最佳实践

1. **服务初始化**
   - 在应用启动时初始化所有服务
   - 使用单例模式确保服务实例唯一
   - 正确处理初始化错误

2. **错误处理**
   - 使用统一的错误类型
   - 记录详细的错误信息
   - 提供友好的错误提示

3. **日志记录**
   - 记录关键操作
   - 包含必要的上下文信息
   - 使用适当的日志级别

4. **性能优化**
   - 实现适当的缓存策略
   - 优化数据库查询
   - 使用批量操作减少请求

5. **测试**
   - 编写单元测试
   - 实现集成测试
   - 测试错误场景