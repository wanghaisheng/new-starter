# 认证服务设计文档

## 概述

认证服务是 HeyTCM 架构中的核心安全组件，采用适配器模式设计，实现了业务逻辑与具体实现的解耦。本服务支持多种认证提供者，包括 Mock、Firebase 和 Better，并提供统一的认证接口。

## 核心优势

1. **统一的服务接口**
   - 所有环境（Mock、开发、生产）使用相同的服务接口
   - 页面层代码无需关心具体实现
   - 业务逻辑保持一致性

2. **无缝环境切换**
   - 通过配置即可切换不同环境
   - 无需修改代码，只需调整环境变量
   - 支持平滑迁移和回滚

3. **数据一致性**
   - 统一的测试数据格式
   - 支持跨环境数据复用
   - 简化测试数据管理

4. **开发效率**
   - 快速切换开发环境
   - 统一的开发体验
   - 减少环境配置工作

## 架构设计

### 核心组件

1. **服务接口 (IAuthService)**
   - 定义认证服务的基本行为
   - 包含初始化、认证和会话管理方法
   - 所有适配器必须实现此接口

2. **服务适配器**
   - 实现特定认证提供者的具体逻辑
   - 支持多种实现方式：
     - Mock 适配器：用于开发和测试
     - Firebase 适配器：用于测试环境
     - Better 适配器：用于生产环境

3. **服务工厂**
   - 负责创建认证服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **服务注册表**
   - 管理认证服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 目录结构

```
src/core/services/auth/
├── types/
│   └── auth-service.ts      # 认证服务接口定义
├── factory/
│   └── auth-service-factory.ts  # 认证服务工厂
├── registry/
│   └── auth-registry.ts     # 认证服务注册表
└── adapters/
    ├── mock/                # Mock 适配器
    │   └── mock-auth-service.ts
    ├── firebase/            # Firebase 适配器
    │   └── firebase-auth-service.ts
    └── better/              # Better 适配器
        └── better-auth-service.ts
```

## 配置示例

```typescript
{
  "environment": "development",
  "services": {
    "auth": {
      "type": "mock",  // 可选值: mock, firebase, better
      "autoLogin": true,
      "testData": {
        "users": [
          {
            "id": "1",
            "email": "test@example.com",
            "name": "Test User"
          }
        ]
      }
    }
  }
}
```

## 接口定义

```typescript
interface IAuthService {
  // 初始化服务
  initialize(config: AuthConfig): Promise<void>;
  
  // 用户认证
  signInWithEmail(email: string, password: string): Promise<User>;
  signInWithSocial(provider: string): Promise<User>;
  signOut(): Promise<void>;
  
  // 用户管理
  getCurrentUser(): Promise<User | null>;
  updateUserProfile(profile: UserProfile): Promise<User>;
  deleteUser(): Promise<void>;
  
  // 会话管理
  getSession(): Promise<Session | null>;
  refreshSession(): Promise<Session>;
}

interface User {
  id: string;
  email: string;
  name: string;
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  user: User;
  token: string;
  expiresAt: Date;
  refreshToken: string;
}
```

## 实现示例

1. **Mock 适配器实现**
   ```typescript
   export class MockAuthService implements IAuthService {
     private users: User[] = [];
     private currentUser: User | null = null;
     
     constructor(private config: AuthConfig) {
       this.users = config.testData?.users || [];
     }
     
     async signInWithEmail(email: string, password: string): Promise<User> {
       const user = this.users.find(u => u.email === email);
       if (!user) {
         throw new AuthError('User not found');
       }
       this.currentUser = user;
       return user;
     }
     
     // 其他方法实现...
   }
   ```

2. **Firebase 适配器实现**
   ```typescript
   export class FirebaseAuthService implements IAuthService {
     private auth: FirebaseAuth;
     
     constructor(private config: AuthConfig) {
       this.auth = initializeAuth(config.firebase);
     }
     
     async signInWithEmail(email: string, password: string): Promise<User> {
       const result = await signInWithEmailAndPassword(this.auth, email, password);
       return this.convertFirebaseUser(result.user);
     }
     
     // 其他方法实现...
   }
   ```

3. **Better 适配器实现**
   ```typescript
   export class BetterAuthService implements IAuthService {
     private client: AuthClient;
     
     constructor(private config: AuthConfig) {
       this.client = new AuthClient(config.better);
     }
     
     async signInWithEmail(email: string, password: string): Promise<User> {
       const result = await this.client.signIn({ email, password });
       return this.convertBetterUser(result.user);
     }
     
     // 其他方法实现...
   }
   ```

## 最佳实践

1. **服务设计**
   - 保持接口一致性
   - 实现必要的转换方法
   - 处理提供者特定的错误
   - 添加适当的日志记录

2. **错误处理**
   - 统一的错误类型
   - 详细的错误信息
   - 适当的日志记录
   - 错误恢复机制

3. **性能优化**
   - 会话缓存
   - 令牌缓存
   - 并发控制
   - 资源管理

4. **安全性**
   - 密码加密
   - 会话安全
   - 令牌安全
   - 访问控制

## 注意事项

1. **配置管理**
   - 使用环境变量
   - 避免硬编码
   - 保护敏感信息
   - 验证配置有效性

2. **资源管理**
   - 及时释放资源
   - 处理连接池
   - 监控资源使用
   - 实现自动清理

3. **日志记录**
   - 关键操作日志
   - 错误追踪
   - 性能监控
   - 安全审计

4. **测试策略**
   - 单元测试适配器
   - 集成测试认证流程
   - 性能测试
   - 安全测试 