# 认证服务（auth）模块架构说明

## 1. 模块定位
- 负责统一管理全端认证（Mock、Firebase、Better、Hybrid等），支持插件式适配器注册与自动降级。
- 采用接口、适配器、工厂、注册表、事件管理、业务聚合等分层，便于扩展与维护。

## 2. 目录结构
```
├── adapters/      # 认证适配器实现（mock/firebase/better/hybrid）
├── factory/       # 工厂与事件管理器
├── registry/      # 注册表（多实例管理、插件注册）
├── service/       # 业务聚合服务层
├── types/         # 统一接口定义
├── api/           # 远程API对接
```

## 3. 主要接口与用法

### 3.1 IAuthAdapter 适配器接口
- 所有认证适配器需实现 `IAuthAdapter`，支持插件式注册与扩展。
- 典型实现：
  ```ts
  import { IAuthAdapter } from '../types/auth-service';
  export class FirebaseAuthService implements IAuthAdapter {
    async initialize() { /* ... */ }
    async loginWithEmail(email, password) { /* ... */ }
    // ... 其它方法 ...
    setConfig?(config: Record<string, any>) { /* 可选扩展 */ }
  }
  ```

### 3.2 工厂与注册表
- 工厂：`AuthServiceFactory.createService(type)` 静态方法创建适配器实例。
- 注册表：`AuthServiceRegistry` 支持多环境多实例注册、插件式适配器注册与自动降级。
- 推荐在应用入口调用：
  ```ts
  import { AuthServiceRegistry } from './registry/auth-service-registry';
  AuthServiceRegistry.registerAllAdapters();
  ```

### 3.3 事件管理器
- `AuthEventManager` 支持认证相关事件订阅与分发，建议后续迁移至 core/events 统一管理。

### 3.4 业务聚合服务
- `AuthService` 仅依赖接口与工厂，便于扩展埋点、缓存、权限校验等横切逻辑。

## 4. hooks 层用法建议
- 推荐所有页面/组件均通过 hooks/useAuth 获取认证状态与方法，禁止直接实例化 Service/Factory。
- hooks 返回值需统一 loading、error、empty 状态，便于页面友好渲染。

## 5. Mock/自动降级
- 测试/开发环境下自动降级到 mock 适配器，生产环境优先 remote。
- 可通过注册表插件式注册自定义适配器。

## 6. 典型用法
```ts
import { useAuth } from '@/core/hooks/useAuth';
const { user, isAuthenticated, isLoading, error, loginWithEmail } = useAuth();
```

## 7. 扩展与维护建议
- 新增适配器时实现 IAuthAdapter 并注册到注册表。
- 事件管理器可迁移至 core/events 实现全局事件总线。
- hooks 层持续完善异常处理与组合扩展能力。

## 8. 如何扩展/新增第三方认证服务

### 8.1 步骤概览
1. 在 `adapters/` 目录下新建你的认证适配器（如 `my-auth-service.ts`），实现 `IAuthAdapter` 接口。
2. 如有必要，在 `lib/auth/` 下实现第三方认证的底层 client（如 `my-auth.ts`），专注于 SDK/协议调用。
3. 在注册表（`registry/`）注册你的适配器，或通过工厂动态选择。
4. 业务层通过统一 hooks/useAuth/useUser 等消费，无需关心底层实现。

### 8.2 示例：自定义第三方 Auth 适配器
```ts
// 1. adapters/my-auth-service.ts
import { IAuthAdapter, AuthUser, AuthResult } from '../types/auth-service';
import { MyAuthClient } from '@/core/lib/auth/my-auth';

export class MyAuthService implements IAuthAdapter {
  async initialize() { /* ... */ }
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const { user, token } = await MyAuthClient.signIn(email, password);
    return { user, token };
  }
  // ...其它方法实现...
}

// 2. registry/auth-registry.ts
import { AuthRegistry } from './auth-registry';
import { MyAuthService } from '../adapters/my-auth-service';
AuthRegistry.register('my-auth', new MyAuthService());
```

### 8.3 推荐规范
- 适配器只负责业务接口转换，不直接依赖第三方 SDK，底层能力抽到 lib/auth 下实现。
- 类型、错误、事件全部走统一定义，便于全局 hooks 处理 loading/error/empty。
- 支持 setConfig、事件订阅、mock 等扩展能力。

### 8.4 常见问题
- **如何切换不同认证服务？**
  在注册表/工厂中指定默认实现，或根据运行环境动态选择。
- **如何做 mock/测试？**
  提供 mock 适配器实现，在测试/开发环境自动降级。

## 服务注册表 getProvider 统一规范

所有 Registry 的 `getProvider` 方法应采用如下统一签名：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB 等服务类型
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```

- 推荐统一调用体验，便于 hooks 泛型化和批量重构。
- 详见[服务架构统一规范](../../../../docs/guides/architecture/services/overview.md)。

---
如需批量注册、自动降级、事件总线、hooks 组合等最佳实践代码模板，请参考本目录或联系架构负责人。
如需更详细的适配器模板或自动注册脚本，请参考 `adapters/` 目录下的现有实现。