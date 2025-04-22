# Service Layer Architecture Overview

## Introduction

The service layer in HeyTCM serves as the core business logic layer, sitting between the presentation layer (UI) and the data layer (database/API). It encapsulates business rules, data transformation, and orchestration of complex operations. The service layer is designed to be environment-aware, automatically adapting to different environments (development, test, production) while maintaining a consistent interface.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Presentation   │────▶│    Service      │────▶│      Data       │
│     Layer       │     │     Layer       │     │      Layer      │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Adapters   │
                    │  (Mock/Fire-│
                    │  base/Better)│
                    └─────────────┘
```

## Core Components

### 1. Service Types

1. **Core Services**
   - Authentication service
   - User management service
   - Data service
   - Storage service

2. **Business Services**
   - Advertising service
   - Analytics service
   - Search service
   - Map service
   - Payment service
   - Push service
   - Messaging service

3. **Utility Services**
   - Logging service
   - Caching service
   - Notification service
   - File handling service
   - AI service
   - Device service
   - Security service

### 2. Service Characteristics

1. **Stateless**
   - Services maintain no client state
   - Each request is independent
   - Scalable horizontally

2. **Reusable**
   - Services can be used by multiple clients
   - Common functionality is centralized
   - Consistent business rules

3. **Transactional**
   - ACID compliance where needed
   - Transaction boundaries clearly defined
   - Rollback capabilities

4. **Secure**
   - Authentication required
   - Authorization enforced
   - Input validation
   - Output sanitization

5. **Environment-Aware**
   - Services automatically adapt to environment
   - Single interface for all environments
   - Transparent implementation switching
   - Consistent behavior across environments

## Design Principles

### 1. Interface Segregation

```typescript
// 服务接口定义
interface IAuthService {
  login(credentials: Credentials): Promise<AuthToken>;
  logout(token: string): Promise<void>;
  refreshToken(token: string): Promise<AuthToken>;
}

interface IUserService {
  createUser(user: UserDTO): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(id: string, user: UserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
```

### 2. Adapter Pattern

```typescript
// 适配器基类
abstract class AuthServiceAdapter implements IAuthService {
  abstract login(credentials: Credentials): Promise<AuthToken>;
  abstract logout(token: string): Promise<void>;
  abstract refreshToken(token: string): Promise<AuthToken>;
}

// 具体适配器实现
class MockAuthServiceAdapter extends AuthServiceAdapter {
  // Mock实现
}

class FirebaseAuthServiceAdapter extends AuthServiceAdapter {
  // Firebase实现
}

class BetterAuthServiceAdapter extends AuthServiceAdapter {
  // Better实现
}
```

### 3. Environment-Aware Service Factory

```typescript
class ServiceFactory {
  private static environment: 'development' | 'test' | 'production';
  private static adapters: Map<string, any> = new Map();

  static setEnvironment(env: 'development' | 'test' | 'production'): void {
    this.environment = env;
  }

  static createAuthService(): IAuthService {
    const adapter = this.getAdapter('auth');
    return new AuthService(adapter);
  }

  private static getAdapter(serviceName: string): any {
    if (!this.adapters.has(serviceName)) {
      const adapter = this.createAdapter(serviceName);
      this.adapters.set(serviceName, adapter);
    }
    return this.adapters.get(serviceName);
  }

  private static createAdapter(serviceName: string): any {
    switch (this.environment) {
      case 'development':
        return new MockAuthServiceAdapter();
      case 'test':
        return new FirebaseAuthServiceAdapter();
      case 'production':
        return new BetterAuthServiceAdapter();
      default:
        throw new Error(`Unsupported environment: ${this.environment}`);
    }
  }
}
```

### 4. Service Configuration

```typescript
interface ServiceConfig {
  environment: 'development' | 'test' | 'production';
  adapters: {
    auth: {
      mock: MockAuthConfig;
      firebase: FirebaseAuthConfig;
      better: BetterAuthConfig;
    };
    // 其他服务配置...
  };
}

class ServiceConfigManager {
  private static config: ServiceConfig;

  static initialize(config: ServiceConfig): void {
    this.config = config;
    ServiceFactory.setEnvironment(config.environment);
  }

  static getConfig(): ServiceConfig {
    return this.config;
  }
}
```

### 5. Error Handling

```typescript
class ServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// Usage
throw new ServiceError(
  'USER_NOT_FOUND',
  'User with given ID not found',
  404
);
```

## 动态加载与多环境多供应商隔离策略

在服务层（包括但不限于认证、数据库、消息、支付等）支持多环境（mock、测试、生产）和多供应商（如 Firebase、Better、BrandA、BrandB）切换时，需严格遵循如下策略以避免副作用：

- **工厂/注册表实现不得在顶层静态 import 具体实现**。
- **所有服务实现必须采用动态 require/import，仅在实际需要时加载**。
- **注册表/工厂仅在需要时注册/实例化目标实现**，避免 mock/测试环境下加载生产依赖。
- **环境变量驱动服务选择，所有环境变量读取应在 run-time 进行**。

### 示例代码
```typescript
// 错误写法（有副作用）
import { BrandAService } from './brand-a-service';
import { BrandBService } from './brand-b-service';

// 正确写法（无副作用）
let ServiceImpl;
if (type === 'brandA') {
  ServiceImpl = require('./brand-a-service').BrandAService;
} else if (type === 'brandB') {
  ServiceImpl = require('./brand-b-service').BrandBService;
}
```

### 结论
只要所有实现都采用动态 require/import，并且注册表/工厂只在需要时注册/实例化，混合“依赖注入 + 工厂/注册表 + 环境变量驱动”模式不会有副作用，mock/测试/生产环境和多供应商均可安全切换。

## 业务服务注册表 getProvider 统一规范

为保证 hooks 及各业务服务调用的一致性、可维护性和可扩展性，所有 Registry 的 `getProvider` 方法应采用统一签名：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB 等服务类型
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```

### 设计说明
- 所有业务服务注册表（如 MatchServiceRegistry、UserServiceRegistry、AuthServiceRegistry 等）必须实现该方法签名。
- 不需要的参数可传 undefined，内部自行判断。
- hooks 层和业务调用层均通过统一接口获取服务实例，禁止直接调用 Factory。
- 便于未来 hooks 泛型化、自动化、批量重构。

### 示例
```typescript
// 推荐用法
const dataService = DataServiceFactory.createService();
const provider = MatchServiceRegistry.getInstance().getProvider('remote', 'default', dataService);
const matchService = provider();

const userProvider = UserServiceRegistry.getProvider('remote', 'default');
const userService = userProvider();
```

### 兼容性
- 历史接口可逐步迁移，建议优先在新业务和核心 hooks 统一。
- 文档、代码模板、测试用例需同步更新。

---

> 本规范适用于所有业务服务注册表（Registry），如有特殊扩展需求请在本文件补充说明。

## 插件化注册表与工厂函数统一模式

为适应多品牌、多供应商、多算法、多类型等业务扩展需求，所有业务服务推荐采用**“注册表+工厂函数”插件化模式**，实现高度灵活、可插拔、易扩展的服务架构。

### 插件化服务工厂标准模板

```typescript
export class XxxServiceFactory {
  private static adapters: Record<XxxServiceType, (options?: XxxServiceOptions) => IXxxAdapter> = {};

  static registerAdapter(type: XxxServiceType, factory: (options?: XxxServiceOptions) => IXxxAdapter) {
    this.adapters[type] = factory;
  }

  static getAdapter(type: XxxServiceType, options?: XxxServiceOptions): IXxxAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  static createService({ type = 'mock', options = {} }: { type?: XxxServiceType, options?: XxxServiceOptions } = {}): IXxxService {
    this.registerAllAdapters();
    return new XxxService(type, options);
  }

  static registerAllAdapters() {
    this.registerAdapter('mock', () => new MockXxxAdapter());
    this.registerAdapter('remote', () => new RemoteXxxAdapter());
    // ...更多类型
  }
}
```

### 服务注册表 getProvider 统一规范

所有 Registry 的 `getProvider` 方法应采用如下统一签名，保证 hooks 及服务层调用一致性：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB/自定义类型等
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```
- hooks 层/业务调用层**只能通过该接口获取服务实例**，严禁直接 Factory。
- 支持多 provider、多实例、运行时扩展。

### 场景说明与最佳实践
- **端能力/多品牌/多算法/多供应商场景**（如 Camera、Bluetooth、NFC、Quiz、Match、Message、Notification 等）强烈建议采用插件化注册表模式。
- **业务实现单一、无扩展需求的服务**可保留 switch-case，但推荐统一注册表接口，便于后续扩展。
- **所有新服务/新适配器**请通过 Factory 的 registerAdapter 注册，严禁硬编码在 createService/switch-case 中。

---

其它架构原则、接口分层、环境感知、事务性、安全性等内容保持原有规范。

如需详细插件化示例或批量重构建议，请参考各业务模块的 factory/registry 实现。

## Implementation Guidelines

### 1. Service Design
- Keep services focused and single-responsibility
- Use interfaces for service contracts
- Implement proper error handling
- Document service behavior

### 2. Adapter Implementation
- Each service should have a base adapter class
- Implement environment-specific adapters
- Ensure consistent behavior across adapters
- Handle environment-specific errors

### 3. Configuration Management
- Centralize service configuration
- Support environment-specific settings
- Enable runtime configuration changes
- Validate configuration on startup

### 4. Testing
- Unit test service logic
- Test adapter implementations
- Integration test service interactions
- Test environment switching
- Mock external dependencies
- Test error scenarios

### 5. Performance
- Implement caching where appropriate
- Use asynchronous operations
- Optimize database queries
- Monitor service metrics

### 6. Security
- Validate all input
- Sanitize all output
- Implement proper authentication
- Follow security best practices

## Related Documentation

- [Core Services](core-services.md)
- [Data Services](data-services.md)
- [Authentication Services](auth-services.md)
- [Business Logic](business-logic.md)
- [Service Communication](service-communication.md)
- [Error Handling](error-handling.md)
- [Testing](testing.md)