# 服务注册表与钩子使用指南

## 服务初始化与获取流程

本项目采用统一的服务注册表机制，确保所有服务只初始化一次，并可以在任何地方获取相同的服务实例。

### 核心概念

- **服务注册表 (ServiceRegistry)**: 中央服务管理器，负责注册、获取和监控所有服务实例
- **服务状态 (ServiceStatus)**: 跟踪每个服务的初始化状态（未初始化、初始化中、已初始化、失败）
- **服务类型 (ServiceType)**: 枚举所有可用的服务类型

## 使用方法

### 在 React 组件中使用服务

有两种方式可以在组件中获取服务：

#### 1. 使用 ServiceProvider 上下文

```tsx
import { useService } from '@/src/providers/ServiceProvider';

function MyComponent() {
  const { authService, dataService } = useService();
  
  // 使用服务...
  return <div>...</div>;
}
```

#### 2. 直接使用服务注册表钩子

```tsx
import { useServiceRegistry } from '@/core/hooks/useServiceRegistry';

function MyComponent() {
  const { getAuthService, getDataService, servicesReady } = useServiceRegistry();
  
  if (!servicesReady) {
    return <div>服务初始化中...</div>;
  }
  
  const authService = getAuthService();
  const dataService = getDataService();
  
  // 使用服务...
  return <div>...</div>;
}
```

### 在非 React 环境中使用服务

```ts
import { getServiceRegistry, ServiceType } from '@/core/services/registry/service-registry';

// 获取服务注册表实例
const serviceRegistry = getServiceRegistry();

// 获取特定服务
const authService = serviceRegistry.getAuthService();
const dataService = serviceRegistry.getDataService();

// 或者通过类型获取
const messageService = serviceRegistry.getService(ServiceType.MESSAGE);
```

## 服务初始化流程

1. 应用启动时，`initializeCoreServices()` 函数会被调用
2. 所有核心服务会被初始化并注册到服务注册表
3. 服务注册表会触发事件通知服务状态变化
4. React 组件可以通过钩子监听服务状态变化

## 添加新服务

1. 在 `ServiceType` 枚举中添加新服务类型
2. 在 `initializeCoreServices()` 中初始化并注册新服务
3. 如果需要，为新服务添加类型化的获取方法

## 最佳实践

- 总是使用服务注册表获取服务实例，避免直接创建新实例
- 在服务初始化前检查服务状态，避免使用未初始化的服务
- 使用类型化的服务获取方法，而不是通用的 `getService()` 方法
- 在 React 组件中，优先使用 `useService()` 钩子获取服务
