# 服务初始化与服务注册表指南

## 概述

HeyTCM 架构采用统一的服务初始化和注册机制，确保所有核心服务只初始化一次，并可以在应用的任何位置获取相同的服务实例。本文档详细说明服务初始化流程、服务注册表的使用方法以及各服务间的依赖关系。

## 服务初始化流程

### 初始化入口

应用启动时，通过调用 `initializeCoreServices` 函数集中初始化所有核心服务。该函数设计为幂等操作，确保即使多次调用也只会执行一次初始化过程。

```typescript
// 在应用入口处调用
import { initializeCoreServices } from '@/core/services/init';

async function startApp() {
  // 初始化所有核心服务
  const serviceRegistry = await initializeCoreServices();
  
  // 应用启动逻辑
  // ...
}
```

### 初始化顺序与依赖关系

服务初始化遵循严格的顺序，确保依赖关系得到正确处理：

1. **适配器注册**：首先注册所有服务适配器，使其全局可用
2. **配置服务**：初始化配置服务，为其他服务提供配置信息
3. **日志服务**：初始化日志服务，用于记录初始化过程和运行时信息
4. **数据库初始化**：初始化数据库结构和默认数据
5. **基础设施服务**：初始化错误处理、网络等基础服务
6. **客户端服务**：初始化客户端相关服务
7. **数据服务**：初始化数据访问服务
8. **认证服务**：初始化用户认证服务
9. **业务服务**：初始化消息、测验、匹配等业务服务

每个服务在初始化过程中都会被注册到全局服务注册表中，并更新其状态。

## 服务注册表

### 概述

服务注册表 (`ServiceRegistry`) 是一个单例类，负责管理所有服务实例的注册和获取。它提供了统一的接口来访问各种服务，并跟踪服务的初始化状态。

### 服务类型

系统定义了一系列服务类型，每种类型对应一个特定的服务：

```typescript
export enum ServiceType {
  AUTH = 'auth',
  CLIENT = 'client',
  DATA = 'data',
  CONFIG = 'config',
  LOGGER = 'logger',
  LOCATION = 'location',
  SENSOR = 'sensor',
  BLUETOOTH = 'bluetooth',
  CAMERA = 'camera',
  NFC = 'nfc',
  NOTIFICATION = 'notification',
  PAYMENT = 'payment',
  MESSAGE = 'message',
  QUIZ = 'quiz',
  MATCH = 'match',
  ONBOARD = 'onboard',
  USER = 'user',
  SETTING = 'setting',
  EMAIL = 'email',
  ERROR = 'error',
  NETWORK = 'network',
  IMAGE = 'image',
  TRANSLATION = 'translation'
}
```

### 服务状态

每个服务在生命周期中可能处于以下状态之一：

```typescript
export enum ServiceStatus {
  NOT_INITIALIZED = 'not_initialized', // 未初始化
  INITIALIZING = 'initializing',       // 正在初始化
  INITIALIZED = 'initialized',         // 已初始化
  FAILED = 'failed'                    // 初始化失败
}
```

### 服务事件

服务注册表实现了事件机制，允许监听服务状态变化：

```typescript
export enum ServiceEvent {
  INITIALIZED = 'service_initialized',       // 服务初始化完成
  FAILED = 'service_failed',                // 服务初始化失败
  ALL_INITIALIZED = 'all_services_initialized', // 所有服务初始化完成
  STATUS_CHANGED = 'service_status_changed'     // 服务状态变更
}
```

## 使用服务注册表

### 获取服务注册表实例

```typescript
import { getServiceRegistry } from '@/core/services/registry/service-registry';

const serviceRegistry = getServiceRegistry();
```

### 获取特定服务

```typescript
import { ServiceType } from '@/core/services/registry/service-registry';

// 获取认证服务
const authService = serviceRegistry.getService<IAuthService>(ServiceType.AUTH);

// 获取数据服务
const dataService = serviceRegistry.getService<IDataService>(ServiceType.DATA);
```

### 监听服务状态变化

```typescript
import { ServiceEvent, ServiceType } from '@/core/services/registry/service-registry';

// 监听特定服务初始化完成
serviceRegistry.on(ServiceEvent.INITIALIZED, ({ type, instance }) => {
  if (type === ServiceType.AUTH) {
    console.log('认证服务初始化完成');
    // 执行依赖认证服务的操作
  }
});

// 监听服务状态变化
serviceRegistry.on(ServiceEvent.STATUS_CHANGED, ({ type, status, prevStatus }) => {
  console.log(`服务 ${type} 状态从 ${prevStatus} 变更为 ${status}`);
});

// 监听所有服务初始化完成
serviceRegistry.on(ServiceEvent.ALL_INITIALIZED, () => {
  console.log('所有核心服务初始化完成');
  // 应用就绪，可以开始业务逻辑
});
```

### 检查服务状态

```typescript
import { ServiceStatus, ServiceType } from '@/core/services/registry/service-registry';

// 检查特定服务状态
const authStatus = serviceRegistry.getServiceStatus(ServiceType.AUTH);
if (authStatus === ServiceStatus.INITIALIZED) {
  // 服务已初始化，可以安全使用
} else if (authStatus === ServiceStatus.FAILED) {
  // 服务初始化失败，需要处理错误情况
}

// 获取所有服务状态
const allServiceStatus = serviceRegistry.getAllServiceStatus();
console.log('所有服务状态:', allServiceStatus);
```

## 服务初始化最佳实践

### 1. 使用标准初始化方法

每个服务都应提供标准的初始化方法，遵循一致的命名和参数约定：

```typescript
// 推荐的初始化方法命名
export async function initServiceName(options?: ServiceOptions) {
  // 初始化逻辑
  return { serviceInstance };
}
```

### 2. 处理初始化失败

服务初始化应妥善处理错误，并更新服务状态：

```typescript
try {
  // 初始化服务
  const service = await initService();
  serviceRegistry.registerService(ServiceType.SERVICE_NAME, service);
} catch (e) {
  logger.error('[init] 服务初始化失败', e);
  serviceRegistry.setServiceStatus(ServiceType.SERVICE_NAME, ServiceStatus.FAILED, e as Error);
  // 可选：提供降级方案或备用服务
}
```

### 3. 懒加载非核心服务

对于非核心服务，可以采用懒加载策略，在首次使用时初始化：

```typescript
let serviceInstance: IService | undefined;

export async function getService(): Promise<IService> {
  if (!serviceInstance) {
    // 首次调用时初始化
    const { initService } = await import('./service-init');
    serviceInstance = await initService();
  }
  return serviceInstance;
}
```

### 4. 服务依赖声明

在注册服务时，明确声明其依赖的其他服务：

```typescript
serviceRegistry.registerService(
  ServiceType.MESSAGE, 
  messageService, 
  [ServiceType.DATA, ServiceType.AUTH] // 依赖的服务
);
```

## 服务获取方法

### 1. 直接从服务注册表获取

```typescript
import { getServiceRegistry, ServiceType } from '@/core/services/registry/service-registry';

function useAuthService() {
  const serviceRegistry = getServiceRegistry();
  return serviceRegistry.getService(ServiceType.AUTH);
}
```

### 2. 使用专用的获取函数

```typescript
import { getAuthService } from '@/core/services/infrastructure/auth';

function authenticateUser(credentials) {
  const authService = getAuthService();
  return authService.login(credentials);
}
```

### 3. 在 React 组件中使用服务钩子

```typescript
import { useAuthService } from '@/core/hooks/services/use-auth-service';

function LoginComponent() {
  const authService = useAuthService();
  
  const handleLogin = async (credentials) => {
    try {
      await authService.login(credentials);
      // 登录成功处理
    } catch (error) {
      // 错误处理
    }
  };
  
  // 组件渲染逻辑
}
```

## 错误处理与故障恢复

### 服务初始化失败处理

当服务初始化失败时，系统应提供适当的降级策略：

1. **记录详细错误信息**：使用日志服务记录失败原因和上下文
2. **更新服务状态**：将服务状态设置为 `FAILED`
3. **通知依赖服务**：通知依赖该服务的其他服务
4. **提供备用实现**：如果可能，提供简化版或模拟版的服务实现
5. **定期重试**：对于关键服务，可以实现定期重试机制

### 示例：服务降级实现

```typescript
try {
  // 尝试初始化真实服务
  const realService = await initRealService();
  serviceRegistry.registerService(ServiceType.SERVICE_NAME, realService);
} catch (e) {
  logger.error('[init] 真实服务初始化失败，使用降级服务', e);
  
  // 创建降级服务
  const fallbackService = createFallbackService();
  serviceRegistry.registerService(ServiceType.SERVICE_NAME, fallbackService);
  
  // 设置服务状态为降级模式（仍然是 INITIALIZED 但有特殊标记）
  serviceRegistry.setServiceMetadata(ServiceType.SERVICE_NAME, { degraded: true, error: e });
}
```

## 总结

HeyTCM 的服务初始化和注册机制提供了一种统一、可靠的方式来管理应用中的各种服务。通过遵循本文档中的最佳实践，开发者可以确保服务的正确初始化、依赖管理和错误处理，从而构建更加健壮和可维护的应用。

服务注册表作为中央管理点，不仅简化了服务的获取和状态监控，还提供了事件机制，使应用的不同部分能够对服务状态变化做出响应。这种设计模式特别适合复杂的现代应用，能够有效管理多个服务之间的交互和依赖关系。