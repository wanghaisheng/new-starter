# 服务实现指南

## 概述

在 HeyTCM 架构中，服务实现主要分为两种方式：第三方服务集成和自建服务实现。本指南将详细说明这两种实现方式的考虑因素、最佳实践和实现建议。

## 第三方服务集成

### 核心考虑因素

1. **服务选择**
   - 功能完整性
   - 性能指标
   - 可靠性保证
   - 成本效益
   - 技术支持
   - 社区活跃度

2. **集成方式**
   - SDK集成
   - API调用
   - Webhook订阅
   - 事件监听

3. **安全考虑**
   - 认证机制
   - 访问控制
   - 数据加密
   - 审计日志

4. **性能优化**
   - 连接池管理
   - 请求限流
   - 缓存策略
   - 重试机制

### 实现建议

1. **SDK集成**
   ```typescript
   // 配置示例
   {
     "thirdParty": {
       "serviceName": {
         "sdk": {
           "version": "latest",
           "config": {
             "apiKey": "your-api-key",
             "endpoint": "https://api.example.com",
             "timeout": 5000,
             "retry": {
               "maxAttempts": 3,
               "backoff": "exponential"
             }
           }
         }
       }
     }
   }

   // 实现示例
   class ThirdPartyService {
     private client: ThirdPartyClient;

     constructor(config: ThirdPartyConfig) {
       this.client = new ThirdPartyClient(config);
     }

     async executeOperation(params: OperationParams): Promise<OperationResult> {
       try {
         return await this.client.operation(params);
       } catch (error) {
         // 错误处理和重试逻辑
         throw new ThirdPartyServiceError(error);
       }
     }
   }
   ```

2. **API调用**
   ```typescript
   // 配置示例
   {
     "thirdParty": {
       "serviceName": {
         "api": {
           "baseUrl": "https://api.example.com",
           "version": "v1",
           "auth": {
             "type": "bearer",
             "token": "your-token"
           },
           "rateLimit": {
             "requests": 100,
             "period": "minute"
           }
         }
       }
     }
   }

   // 实现示例
   class APIClient {
     private config: APIConfig;
     private rateLimiter: RateLimiter;

     constructor(config: APIConfig) {
       this.config = config;
       this.rateLimiter = new RateLimiter(config.rateLimit);
     }

     async request<T>(endpoint: string, options: RequestOptions): Promise<T> {
       await this.rateLimiter.acquire();
       
       const response = await fetch(`${this.config.baseUrl}/${endpoint}`, {
         ...options,
         headers: {
           ...options.headers,
           'Authorization': `Bearer ${this.config.auth.token}`
         }
       });

       if (!response.ok) {
         throw new APIError(response.status, await response.text());
       }

       return response.json();
     }
   }
   ```

### 最佳实践

1. **抽象层设计**
   - 定义统一接口
   - 实现适配器模式
   - 提供降级方案
   - 支持服务切换

2. **错误处理**
   - 异常捕获
   - 错误转换
   - 重试策略
   - 降级处理

3. **监控告警**
   - 性能监控
   - 错误监控
   - 配额监控
   - 告警通知

4. **测试策略**
   - 单元测试
   - 集成测试
   - 模拟测试
   - 性能测试

## 自建服务实现

### 核心考虑因素

1. **数据模型设计**
   - 表结构设计
   - 索引优化
   - 关系定义
   - 约束条件

2. **业务逻辑**
   - 领域模型
   - 业务规则
   - 工作流程
   - 状态管理

3. **性能优化**
   - 查询优化
   - 缓存策略
   - 并发控制
   - 批量处理

4. **可扩展性**
   - 分片策略
   - 复制策略
   - 负载均衡
   - 服务发现

### 实现建议

1. **数据库设计**
   ```sql
   -- 表结构示例
   CREATE TABLE users (
     id VARCHAR(36) PRIMARY KEY,
     username VARCHAR(50) NOT NULL UNIQUE,
     email VARCHAR(100) NOT NULL UNIQUE,
     password_hash VARCHAR(255) NOT NULL,
     status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     INDEX idx_username (username),
     INDEX idx_email (email),
     INDEX idx_status (status)
   );

   -- 关系表示例
   CREATE TABLE user_roles (
     user_id VARCHAR(36) NOT NULL,
     role_id VARCHAR(36) NOT NULL,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, role_id),
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
   );
   ```

2. **服务实现**
   ```typescript
   // 领域模型
   class User {
     constructor(
       public readonly id: string,
       public readonly username: string,
       public readonly email: string,
       private passwordHash: string,
       public status: UserStatus
     ) {}

     static create(data: CreateUserData): User {
       return new User(
         uuidv4(),
         data.username,
         data.email,
         hashPassword(data.password),
         'active'
       );
     }

     changePassword(newPassword: string): void {
       this.passwordHash = hashPassword(newPassword);
     }

     suspend(): void {
       this.status = 'suspended';
     }
   }

   // 仓储实现
   class UserRepository {
     constructor(private db: Database) {}

     async findById(id: string): Promise<User | null> {
       const result = await this.db.query(
         'SELECT * FROM users WHERE id = ?',
         [id]
       );
       return result ? this.toEntity(result) : null;
     }

     async save(user: User): Promise<void> {
       await this.db.query(
         'INSERT INTO users (id, username, email, password_hash, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username = ?, email = ?, password_hash = ?, status = ?',
         [
           user.id, user.username, user.email, user.passwordHash, user.status,
           user.username, user.email, user.passwordHash, user.status
         ]
       );
     }

     private toEntity(data: any): User {
       return new User(
         data.id,
         data.username,
         data.email,
         data.password_hash,
         data.status
       );
     }
   }
   ```

### 最佳实践

1. **数据访问**
   - 使用仓储模式
   - 实现查询优化
   - 控制事务边界
   - 管理连接池

2. **业务逻辑**
   - 领域驱动设计
   - 命令查询分离
   - 事件驱动架构
   - 状态管理

3. **性能优化**
   - 索引优化
   - 查询优化
   - 缓存策略
   - 批量处理

4. **可维护性**
   - 代码组织
   - 文档管理
   - 测试覆盖
   - 版本控制

## 核心业务服务架构最佳实践（2025修订）

### 统一工厂-适配器-接口-自动降级模式

#### 1. 工厂（Factory）职责
- 所有业务服务均应通过工厂类（如 `MatchServiceFactory`、`UserServiceFactory` 等）暴露静态 `createService` 方法创建实例。
- 工厂方法签名统一：

```typescript
static createService(
  type?: 'mock' | 'remote' | 'hybrid',
  dataService?: IDataService
): IServiceInterface
```
- `type` 支持 mock/remote/hybrid，自动根据 `NODE_ENV` 降级（test/dev 默认 mock，prod 默认 remote/hybrid）。
- `dataService` 支持依赖注入，便于测试、mock、hybrid等场景灵活切换。

#### 2. 适配器（Adapter）职责
- 每种类型（mock/remote/hybrid）均有独立适配器，全部实现统一的 Service Interface（如 `IMatchService`）。
- 适配器构造函数参数风格统一，依赖均为可选（如 `dataService?: IDataService`），内部方法需校验依赖是否注入。
- 适配器只关心自身数据来源和业务逻辑，不暴露外部依赖细节。

#### 3. Service Interface 规范
- 所有业务服务均定义统一接口（如 `IMatchService`），上层调用只依赖接口，不关心具体实现。
- 典型接口示例：

```typescript
export interface IMatchService {
  getUserMatches(userId: string): Promise<Match[]>;
  // ... 其他业务方法
}
```

#### 4. hooks 层实践
- hooks 层（如 `useMatches`）通过工厂获取服务实例，严禁直接 new Adapter/Service。
- hooks 只依赖 Service Interface，自动适配 mock/remote/hybrid，支持 loading/error/empty 状态和用户提示。
- 典型用法：

```typescript
const type = process.env.NEXT_PUBLIC_MATCH_SERVICE_TYPE || undefined;
const matchService = useRef(
  MatchServiceFactory.createService(type)
);
const data = await matchService.current.getUserMatches(userId);
```

#### 5. 自动降级与依赖注入
- 工厂内部自动判断环境变量，test/dev 环境自动降级为 mock，生产默认 remote/hybrid。
- 支持通过参数注入自定义 dataService，便于单元测试和 mock 场景。

#### 6. 目录结构与命名规范
- 每个业务模块分为 factory、adapters、types、service、api、worker 等子目录，保持分层清晰。
- 所有类型定义统一放在 types 子目录。

---

## 服务注册表与实例获取规范（2025 修订）

### 1. 统一服务实例获取方式
- 所有业务 hooks/页面/模块**禁止直接调用 ServiceFactory.createService 或 Registry.getService**。
- 必须通过 Registry 的 `getProvider(type, apiBaseUrl, name)` 静态方法获取 provider，再由 provider() 实例化服务。
- 推荐写法：
  ```typescript
  // hooks 内部示例
  const provider = UserServiceRegistry.getProvider(type, apiBaseUrl, 'default');
  const service = provider();
  ```
- 这样可确保参数注入、实例唯一性、自动降级和类型安全。

### 2. 禁止 getService 用法
- Registry.getService 仅为早期遗留方案，**已全局移除**，不得在任何新代码/重构代码中使用。
- 违例示例（禁止）：
  ```typescript
  // 错误用法
  const service = UserServiceRegistry.getService('remote');
  ```
- 如发现遗留 getService 用法，需全部替换为 provider 方案。

### 3. 典型 hooks 场景
- 推荐 hooks 统一以 provider 方式管理服务实例：
  ```typescript
  import { UserServiceRegistry } from '@/core/services/business/user/registry/user-service-registry';
  import { useRef } from 'react';
  // ...
  const provider = UserServiceRegistry.getProvider('remote', apiBaseUrl, 'default');
  const serviceRef = useRef(provider());
  ```
- 便于参数注入、mock 自动降级、测试与扩展。

### 4. 设计原则与扩展
- 所有 Registry 须实现 getProvider 静态方法，禁止暴露 getService。
- 支持 registerProvider 插件式扩展，便于业务自定义。

### 5. 代码审查要求
- PR 审查时必须检查 hooks/页面/服务层是否有 getService 直接调用，发现即驳回。
- 必须有 provider 方式的单元测试覆盖。

---

> ⚠️ 重要：如需兼容早期代码，需优先 refactor 移除 getService，避免团队成员误用。

## 混合实现策略

### 场景分析

1. **核心业务**
   - 优先自建实现
   - 保证数据安全
   - 控制业务逻辑
   - 优化性能

2. **非核心功能**
   - 考虑第三方服务
   - 降低开发成本
   - 快速实现功能
   - 利用专业服务

3. **特殊需求**
   - 评估实现成本
   - 考虑维护成本
   - 权衡性能需求
   - 评估安全风险

### 实现建议

1. **服务组合**
   ```typescript
   class HybridService {
     constructor(
       private inHouseService: InHouseService,
       private thirdPartyService: ThirdPartyService
     ) {}

     async process(data: ProcessData): Promise<ProcessResult> {
       // 使用自建服务处理核心业务
       const coreResult = await this.inHouseService.processCore(data);
       
       // 使用第三方服务处理非核心功能
       const additionalResult = await this.thirdPartyService.processAdditional(coreResult);
       
       return {
         ...coreResult,
         ...additionalResult
       };
     }
   }
   ```

2. **数据同步**
   ```typescript
   class DataSyncService {
     constructor(
       private db: Database,
       private thirdPartyClient: ThirdPartyClient
     ) {}

     async syncData(): Promise<void> {
       // 从第三方服务获取数据
       const externalData = await this.thirdPartyClient.getData();
       
       // 转换数据格式
       const transformedData = this.transformData(externalData);
       
       // 同步到本地数据库
       await this.db.transaction(async (trx) => {
         for (const data of transformedData) {
           await trx.query(
             'INSERT INTO sync_data (...) VALUES (...) ON DUPLICATE KEY UPDATE ...',
             [/* data values */]
           );
         }
       });
     }
   }
   ```

## 服务适配器配置推荐实践

### 推荐：适配器内部自动读取配置

对于需要依赖密钥、Token、API Endpoint 等运行环境敏感参数的服务适配器（如 Telegram、Github、OSS、Stripe 等），**强烈推荐适配器内部自动读取配置**，而不是在 Registry 或调用方传递参数。

- 适配器构造函数应提供默认参数，优先从 `process.env`、全局 config、平台安全存储等读取。
- 这样可避免在 Registry 或页面中硬编码敏感信息，提高安全性和可维护性。
- 适配器可支持通过 options 参数覆盖默认配置，但一般无需强制要求。

#### 示例
```ts
export class TelegramImageAdapter implements IImageService {
  constructor(
    token = process.env.TG_BOT_TOKEN,
    chatId = process.env.TG_CHAT_ID
  ) {
    // ...
  }
}

// Registry 中直接实例化，无需传参
service = new TelegramImageAdapter();
```

### 反例：在 Registry/页面硬编码参数
```ts
// 不推荐
service = new TelegramImageAdapter('hardcode-token', 'hardcode-chatid');
```

### 适用范围
- 推荐所有第三方 API、云服务、消息推送、支付等适配器均采用此模式。
- 业务侧如确需动态切换，可通过 options 参数传递，但一般应优先自动读取。

---
如需统一整改服务适配器实例化方式，请优先采用上述推荐实践。

## 注意事项

1. **第三方服务集成**
   - 服务可用性
   - 接口稳定性
   - 版本兼容性
   - 成本控制

2. **自建服务实现**
   - 开发成本
   - 维护成本
   - 性能要求
   - 安全要求

3. **混合实现**
   - 服务边界
   - 数据一致性
   - 错误处理
   - 监控告警

4. **通用考虑**
   - 可扩展性
   - 可维护性
   - 可测试性
   - 可观测性 