# HeyTCM 服务层设计

## 概述

服务层是 HeyTCM 的核心组件，采用适配器模式设计，实现了业务逻辑与具体实现的解耦。这种设计带来以下核心优势：

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

## 服务层分层职责与协同

### 1. 业务服务（Business Services）
- 负责业务流程编排、业务规则、用例实现。
- 只依赖仓储接口（Repository Interface）和领域服务，不直接操作数据服务或底层实现。
- 通过注册表/工厂注入仓储和基础服务，保证解耦和可测试性。

### 2. 数据服务（Data Services）
- 负责为仓储层（Repository）提供统一的数据访问能力，屏蔽底层数据源（如 SQLite、IndexedDB、Supabase、Mock 等）差异。
- 所有仓储均通过数据服务接口访问数据，不直接依赖具体数据库或第三方 SDK。
- 数据服务层支持多实现（本地/远程/mock/组合），可按需切换，满足多端/多场景需求。
- 数据服务通过注册表/工厂统一管理，支持运行时注入和扩展。

### 3. 基础服务（Infrastructure Services）
- 提供跨业务的通用能力，如日志、缓存、配置、消息、监控等。
- 业务服务和数据服务均可依赖基础服务。

### 4. 分层协同原则
- 业务服务 → 仓储接口（Repository）→ 数据服务（DataService）→ 具体数据源/adapter
- 业务服务与数据服务之间通过仓储接口解耦，仓储层是类型契约和隔离点。
- 数据服务支撑所有仓储接口，保证类型一致性和多实现切换能力。

> 推荐所有类型定义集中在 `types/` 目录，注册表/工厂统一暴露服务获取接口，禁止直接 new/调用底层实现。

### 环境切换示例

```typescript
// 开发环境
bun run dev --env=mock

// 测试环境
bun run dev --env=firebase

// 生产环境
bun run dev --env=better
```

### 数据注入示例

```typescript
// 统一的测试数据格式
const testData = {
  users: [
    {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }
  ],
  // 其他测试数据
};

// 环境配置
{
  "environment": "development",
  "services": {
    "auth": {
      "type": "mock",
      "testData": testData  // 所有环境使用相同的数据格式
    }
  }
}
```

### 优势总结

1. **开发体验**
   - 统一的 API 调用方式
   - 无需修改业务代码
   - 快速环境切换

2. **维护成本**
   - 集中管理服务实现
   - 简化配置管理
   - 降低运维复杂度

3. **测试效率**
   - 统一的测试数据
   - 跨环境测试支持
   - 快速验证功能

4. **部署灵活**
   - 按需选择实现
   - 平滑迁移能力
   - 降低部署风险

## 架构设计

### 核心组件

1. **服务接口 (IService)**
   - 定义服务的基本行为
   - 包含初始化、释放和状态检查方法
   - 所有服务必须实现此接口

2. **服务适配器**
   - 实现特定服务的具体逻辑
   - 支持多种实现方式：
     - Mock 适配器：用于开发和测试
     - Firebase 适配器：用于测试环境
     - Better 适配器：用于生产环境
     - FakeIndexedDB 适配器：用于 mock 阶段，支持纯内存 mock 和离线/在线混合场景

3. **服务工厂**
   - 负责创建服务实例
   - 根据配置选择适当的适配器
   - 实现单例模式确保全局唯一实例

4. **服务注册表**
   - 管理服务提供者
   - 支持动态注册和注销
   - 提供服务发现功能

### 与 API Router 的关系

1. **API 路由层**
   - 位于 `app/api` 目录
   - 负责处理 HTTP 请求
   - 调用相应的服务方法
   - 返回 HTTP 响应

2. **服务调用流程**
   ```
   HTTP Request -> API Router -> Service Factory -> Service Adapter -> Database
   ```

3. **错误处理**
   - API 层捕获服务异常
   - 转换为适当的 HTTP 状态码
   - 返回标准化的错误响应

### 与数据库的关系

1. **数据库适配器**
   - 封装数据库访问逻辑
   - 支持多种数据库：
     - Mock 数据库：内存存储
     - Firebase：Firestore
     - Better：自定义数据库
     - FakeIndexedDB：支持纯内存 mock 和离线/在线混合场景

2. **数据转换**
   - 服务层负责数据格式转换
   - 确保数据一致性
   - 处理类型映射

## 数据服务架构与设计

> ⚠️ 数据服务架构与设计、服务注册表（Registry）方法规范等详细内容请查阅 [data/README.md](./data/README.md) 及相关 guides 文档，避免重复维护。

## 文件夹结构

```text
src/core/services/
├── business/         # 业务服务（仅聚合领域逻辑）
│   ├── auth/         # 认证服务
│   ├── user/         # 用户服务
│   ├── match/        # 匹配服务
│   ├── messages/     # 消息服务
│   ├── onboard/      # 新手引导
│   ├── photo/        # 图片/相册
│   ├── quiz/         # 测验/题库
│   ├── speak/        # 语音能力
│   └── ...           # 其它领域业务聚合
├── data/             # 数据服务（统一数据访问，插件化注册表+工厂+适配器分层）
│   ├── adapters/     # 各类数据库适配器（Better、Firebase、FakeIndexedDB、SQLite、Supabase、Turso等）
│   ├── registry/     # 数据服务注册表
│   ├── factory/      # 数据服务工厂
│   ├── types/        # 类型定义
│   └── ...           # 其它数据相关实现
├── infrastructure/   # 基础服务（通用能力、端适配、第三方/原生 provider）
│   ├── ai-task/      # AI 能力封装
│   ├── auth/         # 认证与鉴权
│   ├── client/       # 客户端本地能力（local-storage、sensor、media、file-system、pwa等）
│   ├── config/       # 配置服务
│   ├── data-initializer/ # 数据初始化与导入
│   ├── email/        # 邮件服务
│   ├── error/        # 错误处理
│   ├── image/        # 图片处理
│   ├── logger/       # 日志服务
│   ├── network/      # 网络服务（蓝牙、WiFi、网络设备等）
│   ├── notifications/# 消息与通知
│   ├── payment/      # 支付服务
│   ├── phone/        # 手机相关服务 传感器摄像头蓝牙等
│   ├── translation/  # 翻译服务
│   ├── advertising/  # 广告服务
│   ├── analytics/    # 分析服务
│   ├── search/       # 搜索服务
│   ├── map/          # 地图服务
│   ├── social/       # 社交服务
│   ├── media/        # 媒体服务
│   ├── device/       # 设备服务
│   ├── security/     # 安全服务
│   └── ...           # 其它基础能力与三方集成
├── hooks/            # 通用 hooks
├── types.ts          # 全局类型定义
├── service-design-guidelines.md # 服务设计规范总览
└── README.md         # 当前文档
```

> 绝大多数通用服务、端适配、第三方能力均应归档于 infrastructure 目录，业务服务仅聚合领域业务逻辑，所有通用实现与适配全部下沉至基础服务。

## 文件命名规范

1. **接口文件**
   - 以 `I` 开头，如 `IService`
   - 使用 PascalCase
   - 放在 `types` 目录

2. **实现文件**
   - 使用 PascalCase
   - 包含实现类型，如 `MockAuthService`
   - 放在对应的适配器目录

3. **工厂和注册表**
   - 以 `Factory` 或 `Registry` 结尾
   - 使用 PascalCase
   - 放在对应的目录

4. **配置文件**
   - 使用 kebab-case
   - 以 `.config.ts` 结尾
   - 放在服务根目录

### 代码组织原则

1. **模块化**
   - 每个服务独立模块
   - 清晰的依赖关系
   - 最小化耦合

2. **可扩展性**
   - 易于添加新服务
   - 支持新适配器
   - 灵活的配置

3. **可维护性**
   - 一致的代码风格
   - 完整的文档
   - 清晰的注释

4. **可测试性**
   - 单元测试友好
   - 依赖注入支持
   - 模拟数据支持

## 数据类型统一入口说明

> 所有数据模型、表结构、实体类型、批量操作等，**统一从 `src/core/lib/db/types/index.ts` 导出**。业务服务、Repository、API Router、前端 Model 等均需通过该入口获取类型定义。

- **禁止在服务、适配器、API 层自行维护/复制类型**，避免 schema 变动后类型不一致。
- **Schema 发生变化时**，需同步更新 Repository、Models、Types，所有依赖类型的服务、API Router 等均应通过统一入口 import。
- 推荐通过 `@/core/lib/db/types` 进行类型引用。

## 服务扩展指南

> 详细的服务扩展、适配器开发、混合存储、同步机制等说明，请分别查阅：
>
> - [data/README.md](./data/README.md)（数据服务扩展、混合存储、同步管理等）
> - [infrastructure/README.md](./infrastructure/README.md)（基础服务扩展、端适配、第三方能力集成等）
> - [business/README.md](./business/README.md)（业务服务聚合与扩展）

如需添加新服务、扩展适配器、实现混合存储或同步机制，请优先查阅上述分层文档，遵循统一规范进行开发和注册。

## Error 处理与返回值设计规范

### 1. 服务层异常抛出
- 所有业务异常必须 `throw new Error('...')`，禁止返回 string/number/any。
- 推荐所有接口/方法在异常情况下抛出标准 Error。

### 2. 返回值结构
- 推荐采用 either-style（如 { data, error }），但实际 hooks 体系通常直接抛异常，由 hooks 捕获。
- 不建议返回错误码或特殊结构表示异常。

### 3. 事件驱动场景
- 事件型 Service 的 error 事件 payload 结构为 `{ error: Error }`，与 hooks 层约定一致。

### 4. 典型反例
- 禁止 service 返回 string/number/any 作为错误。
- 禁止页面/组件直接 try/catch service 抛出的 string/number。

> 更多最佳实践、接口模板、标准返回结构、错误分型等请查阅 [service-design-guidelines.md](./service-design-guidelines.md)。
