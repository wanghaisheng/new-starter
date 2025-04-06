# 认证系统架构文档

## 1. 认证系统概述

认证系统采用工厂模式和提供者注册机制，支持多种认证方式，包括本地模拟认证、自定义认证服务和第三方认证服务（如Firebase）。系统设计遵循开闭原则，便于扩展新的认证提供者。

## 2. 核心组件

### 2.1 认证服务接口 (IAuthService)

定义所有认证提供者必须实现的通用方法：

```typescript
export interface IAuthService {
  // 使用邮箱和密码登录
  login(email: string, password: string): Promise<User>;
  
  // 使用手机号和验证码登录
  loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User>;
  
  // 发送验证码到指定手机号
  sendVerificationCode(phoneNumber: string): Promise<void>;
  
  // 登出当前用户
  logout(): Promise<void>;
  
  // 获取当前登录用户
  getCurrentUser(): User | null;
  
  // 检查用户是否已认证
  isAuthenticated(): boolean;
}
```

### 2.2 认证提供者注册表 (AuthProviderRegistry)

管理所有可用的认证提供者，支持动态注册和查询：

```typescript
export interface AuthProvider {
  name: string;                    // 提供者唯一标识
  createService: () => IAuthService; // 创建服务实例的工厂函数
  configSchema?: Record<string, any>; // 配置验证模式
}

export class AuthProviderRegistry {
  // 单例模式
  private static instance: AuthProviderRegistry | null = null;
  private providers: Map<string, AuthProvider> = new Map();
  
  // 注册新的认证提供者
  registerProvider(provider: AuthProvider): void;
  
  // 获取指定名称的认证提供者
  getProvider(name: string): AuthProvider | undefined;
  
  // 获取所有可用的认证提供者名称
  getAvailableProviders(): string[];
}
```

### 2.3 认证服务工厂 (AuthServiceFactory)

根据配置创建和管理认证服务实例：

```typescript
export class AuthServiceFactory {
  // 单例模式
  private static instance: AuthServiceFactory | null = null;
  private authService: IAuthService | null = null;
  private serviceType: string = 'better'; // 默认使用better认证
  
  // 设置认证服务类型
  public setServiceType(type: string): void;
  
  // 获取认证服务实例
  public getAuthService(): IAuthService;
  
  // 重置认证服务实例
  public resetAuthService(): void;
}
```

### 2.4 认证配置 (AuthConfig)

定义认证服务的配置结构：

```typescript
export interface AuthConfig {
  // 认证服务类型
  type: string;
  
  // Firebase配置
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  // Better Auth配置
  better?: {
    apiKey: string;
    apiUrl: string;
  };
  
  // Mock Auth配置
  mock?: {
    enabled: boolean;
    users: string; // 格式: "email:password,email2:password2"
    phones: string; // 格式: "phone:code,phone2:code2"
  };
  
  // 其他提供者的配置...
}
```

## 3. 内置认证提供者

### 3.1 Mock认证提供者 (MockAuthService)

用于开发和测试环境，使用预定义的测试账号：

```typescript
export class MockAuthService implements IAuthService {
  // 实现IAuthService接口的所有方法
  // 使用内存中的Map存储用户信息
}
```

### 3.2 Better认证提供者 (BetterAuthService)

自定义认证服务实现：

```typescript
export class BetterAuthService implements IAuthService {
  // 实现IAuthService接口的所有方法
  // 使用自定义API进行认证
}
```

### 3.3 Firebase认证提供者 (FirebaseAuthService)

使用Firebase Authentication服务：

```typescript
export class FirebaseAuthService implements IAuthService {
  // 实现IAuthService接口的所有方法
  // 使用Firebase SDK进行认证
}
```

## 4. 如何添加新的认证提供者

### 4.1 创建认证服务类

1. 创建一个新的类，实现`IAuthService`接口：

```typescript
// src/core/services/custom-auth-service.ts
import { IAuthService } from './auth-service';
import { User } from '@/core/lib/db/types';

export class CustomAuthService implements IAuthService {
  private static instance: CustomAuthService | null = null;
  
  // 实现IAuthService接口的所有方法
  public async login(email: string, password: string): Promise<User> {
    // 实现登录逻辑
  }
  
  public async loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
    // 实现手机号登录逻辑
  }
  
  public async sendVerificationCode(phoneNumber: string): Promise<void> {
    // 实现发送验证码逻辑
  }
  
  public async logout(): Promise<void> {
    // 实现登出逻辑
  }
  
  public getCurrentUser(): User | null {
    // 实现获取当前用户逻辑
  }
  
  public isAuthenticated(): boolean {
    // 实现检查认证状态逻辑
  }
  
  // 单例模式
  public static getInstance(): CustomAuthService {
    if (!CustomAuthService.instance) {
      CustomAuthService.instance = new CustomAuthService();
    }
    return CustomAuthService.instance;
  }
}
```

### 4.2 注册认证提供者

在`registerAuthProviders`函数中注册新的提供者：

```typescript
// src/core/services/auth-providers/index.ts
import { AuthProviderRegistry } from '../auth-provider-registry';
import { CustomAuthService } from '../custom-auth-service';

export function registerAuthProviders(): void {
  const registry = AuthProviderRegistry.getInstance();
  
  // 注册自定义认证提供者
  registry.registerProvider({
    name: 'custom',
    createService: () => CustomAuthService.getInstance(),
    configSchema: {
      // 定义配置验证模式
      apiUrl: 'string',
      apiKey: 'string',
      // 其他配置项...
    }
  });
  
  // 注册其他提供者...
}
```

### 4.3 更新认证配置接口

在`AuthConfig`接口中添加新提供者的配置：

```typescript
// src/core/config/auth-config.ts
export interface AuthConfig {
  // 现有配置...
  
  // 添加自定义认证提供者配置
  custom?: {
    apiUrl: string;
    apiKey: string;
    // 其他配置项...
  };
}
```

### 4.4 配置环境变量

在`.env.local`文件中添加新提供者的配置：

```
# 认证服务类型
NEXT_PUBLIC_AUTH_SERVICE_TYPE=custom

# 自定义认证服务配置
NEXT_PUBLIC_CUSTOM_AUTH_API_URL=https://api.example.com
NEXT_PUBLIC_CUSTOM_AUTH_API_KEY=your-api-key
```

## 5. 使用认证服务

### 5.1 在组件中使用

使用`useServices`钩子获取认证服务实例：

```typescript
import { useServices } from '@/core/hooks/useServices';

function LoginComponent() {
  const { authService, isLoading, error } = useServices();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await authService?.login(email, password);
      // 处理登录成功...
    } catch (err) {
      // 处理登录失败...
    }
  };
  
  // 组件渲染...
}
```

### 5.2 切换认证提供者

在运行时切换认证提供者：

```typescript
import { AuthServiceFactory } from '@/core/services/auth-service';

// 切换到Firebase认证
AuthServiceFactory.getInstance().setServiceType('firebase');

// 切换到Mock认证
AuthServiceFactory.getInstance().setServiceType('mock');
```

## 6. 最佳实践

### 6.1 认证提供者开发

1. **遵循接口约定**：确保完全实现`IAuthService`接口的所有方法
2. **错误处理**：提供详细的错误信息，便于调试
3. **状态管理**：正确管理用户认证状态
4. **安全性**：不存储敏感信息，使用安全的存储机制
5. **测试**：为新的认证提供者编写单元测试和集成测试

### 6.2 配置管理

1. **环境变量**：使用环境变量存储敏感配置
2. **配置验证**：使用配置模式验证配置有效性
3. **默认值**：为可选配置提供合理的默认值
4. **文档化**：为配置项提供清晰的文档说明

### 6.3 迁移策略

1. **渐进式迁移**：支持同时使用多个认证提供者
2. **数据同步**：确保用户数据在不同提供者之间同步
3. **回滚机制**：提供简单的回滚机制，应对迁移问题

## 7. 故障排除

### 7.1 常见问题

1. **认证服务初始化失败**：
   - 检查环境变量配置
   - 验证提供者注册状态
   - 检查网络连接

2. **登录失败**：
   - 验证凭据正确性
   - 检查API端点可用性
   - 查看错误日志

3. **状态不一致**：
   - 清除本地存储
   - 重新初始化认证服务
   - 检查状态管理逻辑

### 7.2 调试技巧

1. **启用详细日志**：
   ```typescript
   // 在开发环境中启用详细日志
   if (process.env.NODE_ENV === 'development') {
     console.log('Auth service type:', process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE);
     console.log('Available providers:', AuthProviderRegistry.getInstance().getAvailableProviders());
   }
   ```

2. **使用Mock提供者测试**：
   ```typescript
   // 在测试环境中使用Mock提供者
   if (process.env.NODE_ENV === 'test') {
     AuthServiceFactory.getInstance().setServiceType('mock');
   }
   ```

3. **检查认证状态**：
   ```typescript
   const authService = AuthServiceFactory.getInstance().getAuthService();
   console.log('Is authenticated:', authService.isAuthenticated());
   console.log('Current user:', authService.getCurrentUser());
   ```

## 8. 未来计划

1. **OAuth集成**：添加对OAuth 2.0提供者的支持
2. **生物认证**：集成生物识别认证（指纹、面部识别）
3. **多因素认证**：支持多因素认证流程
4. **单点登录**：实现跨应用的单点登录
5. **认证分析**：添加认证事件分析和监控 