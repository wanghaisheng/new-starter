# 客户端服务（ClientService）使用与最佳实践

本文档介绍如何使用客户端服务（ClientService）进行客户端本地环境相关的操作，如本地存储、传感器访问等。客户端服务采用了与配置服务类似的初始化流程和单例管理模式，支持从配置服务获取服务类型并动态选择适配器。

## 一、基本概念

客户端服务（ClientService）是一个统一的服务层，用于封装所有与客户端本地环境相关的操作，如：

- 本地存储（localStorage/sessionStorage）
- 传感器访问（陀螺仪、定位等）
- 本地通知
- 剪贴板操作
- 文件系统访问
- 等等

通过统一的服务接口，业务代码可以不关心具体的实现细节，而是通过服务层进行操作，实现前后端解耦、统一能力抽象和团队协作。

## 二、快速开始

### 1. 在业务代码中使用客户端服务

```typescript
import { getClientService } from '@/core/services/infrastructure/client';

// 获取客户端服务实例
const clientService = getClientService();

// 使用客户端服务
const value = clientService.getStorageItem('key');
clientService.setStorageItem('key', 'value');
```

### 2. 在组件中使用客户端服务

```typescript
import { useEffect, useState } from 'react';
import { getClientService } from '@/core/services/infrastructure/client';

function MyComponent() {
  const [value, setValue] = useState<string | null>(null);
  
  useEffect(() => {
    const clientService = getClientService();
    const storedValue = clientService.getStorageItem('key');
    setValue(storedValue);
  }, []);
  
  return <div>{value}</div>;
}
```

## 三、初始化流程

客户端服务采用了与配置服务类似的初始化流程和单例管理模式，支持从配置服务获取服务类型并动态选择适配器。

### 1. 自动初始化（推荐）

在应用启动时，通过 `initializeCoreServices` 方法会自动初始化客户端服务，无需手动调用。

```typescript
import { initializeCoreServices } from '@/core/services/init';

// 在应用启动时调用
await initializeCoreServices();
```

### 2. 手动初始化（特殊场景）

如果需要在特定场景下手动初始化客户端服务，可以使用 `initClientService` 方法。

```typescript
import { initClientService } from '@/core/services/infrastructure/client';
import { ClientProviderType } from '@/core/services/infrastructure/client/registry/client-service-registry';

// 手动初始化客户端服务
const { clientService } = await initClientService(ClientProviderType.MOCK);
```

## 四、配置与环境适配

客户端服务支持通过环境变量或配置服务进行配置，自动选择适合的适配器。

### 1. 环境变量配置

可以通过以下环境变量配置客户端服务：

- `NEXT_PUBLIC_CLIENT_PROVIDER`：客户端服务提供者类型
- `CLIENT_ADAPTER`：客户端服务适配器类型（兼容旧版本）

### 2. 配置服务配置

也可以通过配置服务进行配置：

```typescript
import { getConfigService } from '@/core/services/infrastructure/config';

const configService = getConfigService();
configService.set('NEXT_PUBLIC_CLIENT_PROVIDER', 'mock');
```

## 五、工厂注册与环境适配机制（进阶）

### 1. 如何使用工厂注册和环境适配能力

#### 1.1 应用入口初始化（推荐做法）

```typescript
import { initClientService } from '@/core/services/infrastructure/client';

// 在 SSR 启动、Next.js _app.tsx 或 CoreInitializer.tsx 最早期调用
await initClientService(); // 自动探测环境变量并加载合适的 provider
```

- 只需初始化一次，后续所有业务代码、Provider、hook 都能安全访问客户端服务。

#### 1.2 自定义适配器注册

如果需要注册自定义适配器，可以使用 `ClientServiceRegistry.registerAdapter` 方法。

```typescript
import { ClientServiceRegistry } from '@/core/services/infrastructure/client/registry/client-service-registry';

// 注册自定义适配器
ClientServiceRegistry.registerAdapter('custom', () => {
  return {
    // 实现客户端服务接口
    getStorageItem: (key: string) => {
      // 自定义实现
      return null;
    },
    setStorageItem: (key: string, value: string) => {
      // 自定义实现
      return true;
    },
    // 其他客户端服务方法
  };
});
```

## 六、最佳实践

### 1. 单例模式

客户端服务采用单例模式，确保全局只有一个实例，避免重复创建和资源浪费。

```typescript
import { getClientService } from '@/core/services/infrastructure/client';

// 获取客户端服务实例（全局单例）
const clientService = getClientService();
```

### 2. 错误处理

使用客户端服务时，应该进行适当的错误处理，避免因客户端环境差异导致的异常。

```typescript
import { getClientService } from '@/core/services/infrastructure/client';

try {
  const clientService = getClientService();
  const value = clientService.getStorageItem('key');
} catch (e) {
  console.error('客户端服务异常', e);
  // 降级处理
}
```

### 3. 环境适配

在不同环境下，客户端服务会自动选择适合的适配器，无需手动判断环境。

```typescript
import { getClientService } from '@/core/services/infrastructure/client';

// 获取客户端服务实例（自动适配环境）
const clientService = getClientService();
```

## 七、常见问题

### 1. 客户端服务未初始化

如果在使用客户端服务前未初始化，会抛出异常。确保在使用前已经调用了 `initializeCoreServices` 或 `initClientService`。

### 2. 适配器不存在

如果指定的适配器类型不存在，会使用默认适配器。确保已经注册了所需的适配器。

### 3. 浏览器兼容性

客户端服务会自动处理浏览器兼容性问题，如 localStorage 不可用等情况。但在使用特定功能时，仍需注意浏览器兼容性。

## 八、扩展与定制

### 1. 添加新的客户端服务方法

如果需要添加新的客户端服务方法，可以扩展 `IClientAdapter` 接口和 `ClientService` 接口。

```typescript
// 扩展 IClientAdapter 接口
export interface IClientAdapter {
  // 现有方法
  getStorageItem(key: string): string | null;
  setStorageItem(key: string, value: string): boolean;
  
  // 新增方法
  getLocation(): Promise<GeolocationPosition>;
}
```

### 2. 添加新的适配器类型

如果需要添加新的适配器类型，可以扩展 `ClientProviderType` 枚举。

```typescript
export enum ClientProviderType {
  DEFAULT = 'default',
  MOCK = 'mock',
  LOCAL = 'local',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  // 新增类型
  CUSTOM = 'custom',
}
```

## 九、总结

客户端服务（ClientService）提供了一个统一的服务层，用于封装所有与客户端本地环境相关的操作，支持从配置服务获取服务类型并动态选择适配器。通过客户端服务，业务代码可以不关心具体的实现细节，而是通过服务层进行操作，实现前后端解耦、统一能力抽象和团队协作。