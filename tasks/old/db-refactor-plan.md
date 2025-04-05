# 数据库重构执行计划

根据我们之前的分析和设计，以下是数据库重构的详细执行计划，包括每个阶段的具体任务和时间安排。

```markdown:d:\Download\audio-visual\heytcm\new-starter\docs\tasks\db-refactor-plan.md
# 数据库代码结构分析与优化建议

通过分析当前代码库，我发现存在一些重复和不一致的数据库实现。以下是我的分析和优化建议：

## 存在的问题

1. **目录结构重复**：
   - `lib/db/local/indexeddb.ts` 和 `lib/db/indexeddb/indexeddb-client.ts` 实现了相似的功能
   - `lib/db/mock/mock-database-client.ts` 和 `lib/db/mock/client.ts` 可能有重复

2. **接口不一致**：
   - 一些客户端使用 `initialize()/close()` 方法
   - 另一些使用 `connect()/disconnect()` 方法

3. **模型定义分散**：
   - 模型定义在多个地方出现，如 `interfaces.ts` 和 `schema/models.ts`

4. **数据库操作方法不统一**：
   - 有些使用 `getMessages(matchId)`
   - 有些使用 `getMessagesByMatchId(matchId)`

5. **硬编码的 SQL 语句**：
   - 大量使用硬编码的 SQL 语句，不利于维护和扩展
   - 缺乏 ORM 支持，导致代码冗长且容易出错

6. **与表名紧耦合**：
   - 数据库客户端与具体表名紧密耦合，不符合关注点分离原则

## 优化方案

### 1. 统一目录结构

```
d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\
├── clients/                  # 所有数据库客户端实现
│   ├── base-client.ts        # 基础客户端抽象类
│   ├── cloudflare/           # Cloudflare 相关实现
│   ├── firebase/             # Firebase 相关实现
│   ├── indexeddb/            # IndexedDB 相关实现
│   ├── mock/                 # 模拟数据库实现
│   └── sqlite/               # SQLite 相关实现
├── models/                   # 数据模型定义
│   ├── base.ts               # 基础模型接口
│   ├── user.ts               # 用户模型
│   ├── match.ts              # 匹配模型
│   └── message.ts            # 消息模型
├── repositories/             # 仓储模式实现
│   ├── base-repository.ts    # 基础仓储抽象类
│   ├── user-repository.ts    # 用户仓储
│   ├── match-repository.ts   # 匹配仓储
│   └── message-repository.ts # 消息仓储
├── schema/                   # 数据库表结构定义
│   ├── registry.ts           # 表结构注册中心
│   ├── adapters/             # ORM 适配器
│   │   └── drizzle-adapter.ts # Drizzle ORM 适配器
│   └── definitions/          # 各数据库的表定义
├── interfaces.ts             # 核心接口定义
├── factory.ts                # 数据库客户端工厂
└── service.ts                # 数据库服务
```

## 详细执行计划

### 第一阶段：重构目录结构（1-2天）

#### 任务1.1：创建新的目录结构
- 创建 `clients`, `models`, `repositories`, `schema` 等目录
- 确保目录结构符合上述设计

#### 任务1.2：移动现有文件
- 将 `base-client.ts` 移动到 `clients` 目录
- 将现有的客户端实现移动到对应的子目录
- 将模型定义移动到 `models` 目录

### 第二阶段：统一接口（2-3天）

#### 任务2.1：更新 interfaces.ts
- 创建 `IBaseDatabaseClient` 接口，定义通用数据访问方法
- 更新 `IDatabaseClient` 接口，继承 `IBaseDatabaseClient`
- 确保接口定义清晰、一致

#### 任务2.2：更新 BaseClient
- 实现 `IBaseDatabaseClient` 接口
- 添加通用的辅助方法
- 确保所有抽象方法定义正确

### 第三阶段：引入仓储模式（2-3天）

#### 任务3.1：创建基础仓储类
- 实现 `BaseRepository` 抽象类
- 定义通用的 CRUD 操作
- 添加查询和过滤功能

#### 任务3.2：实现具体仓储类
- 创建 `UserRepository`, `MatchRepository`, `MessageRepository`
- 实现特定于模型的查询方法
- 确保仓储类与数据库客户端正确交互

### 第四阶段：集成 Drizzle ORM（3-4天）

#### 任务4.1：安装依赖
```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

#### 任务4.2：创建表结构注册中心
- 实现 `SchemaRegistry` 类
- 定义表结构和列定义接口
- 添加表结构注册和获取方法

#### 任务4.3：创建 Drizzle 适配器
- 实现 `DrizzleSchemaAdapter` 类
- 添加表结构转换方法
- 实现迁移生成功能

### 第五阶段：重构客户端实现（4-5天）

#### 任务5.1：更新 MockDatabaseClient
- 实现 `IBaseDatabaseClient` 接口
- 添加通用数据访问方法
- 确保测试用例通过

#### 任务5.2：更新 IndexedDBClient
- 重构为使用 Drizzle ORM
- 实现通用数据访问方法
- 添加事务支持

#### 任务5.3：实现 CloudflareD1Client
- 集成 Drizzle ORM
- 实现所有抽象方法
- 添加迁移支持

### 第六阶段：更新服务层（2-3天）

#### 任务6.1：更新 DatabaseService
- 添加仓储管理功能
- 提供仓储获取方法
- 确保向后兼容性

#### 任务6.2：更新 DatabaseFactory
- 支持创建新的客户端实现
- 添加仓储创建功能
- 确保配置正确传递

### 第七阶段：测试与文档（2-3天）

#### 任务7.1：编写单元测试
- 为新的接口和类编写测试
- 确保所有功能正常工作
- 验证向后兼容性

#### 任务7.2：更新文档
- 更新 API 文档
- 添加使用示例
- 编写迁移指南

## 风险与缓解措施

1. **向后兼容性风险**
   - **风险**：重构可能破坏现有代码
   - **缓解**：保留旧接口，通过适配器模式过渡

2. **性能风险**
   - **风险**：ORM 可能引入性能开销
   - **缓解**：进行性能测试，优化关键查询

3. **学习曲线风险**
   - **风险**：团队需要学习新的 ORM 和模式
   - **缓解**：提供培训和详细文档

## 里程碑

1. **M1**：目录结构重构完成（第1天）
2. **M2**：接口统一完成（第4天）
3. **M3**：仓储模式实现完成（第7天）
4. **M4**：Drizzle ORM 集成完成（第11天）
5. **M5**：客户端实现更新完成（第16天）
6. **M6**：服务层更新完成（第19天）
7. **M7**：测试与文档完成（第22天）

## 总结

这个重构计划将使我们的数据库代码更加一致、可维护，并为未来的扩展提供更好的基础。通过引入 Drizzle ORM 和仓储模式，我们可以减少与具体表名的耦合，提高代码的可测试性和可扩展性。

整个重构预计需要约22个工作日完成，可以根据实际情况调整进度。建议采用渐进式重构，确保每个阶段完成后系统仍然可以正常工作。
```

这个执行计划提供了更详细的任务分解、时间估计和里程碑，使重构工作更加可控和可跟踪。同时，我也添加了风险分析和缓解措施，帮助团队提前识别和应对可能的问题。