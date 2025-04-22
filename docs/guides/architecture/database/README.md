# Database Documentation

This directory contains comprehensive documentation for database development in the HeyTCM project.

## 目录结构

```
├── README.md                # 数据库文档总览（本文件）
├── core/                    # 核心设计与最佳实践
│   ├── README.md
│   ├── best-practices.md    # 技术实现规范与模式
│   ├── development-workflow.md # 开发流程与阶段
│   ├── schema-design.md     # 数据库表结构设计原则
│   └── repository-pattern.md# 仓储模式实现细节
├── implementation/          # 具体实现与配置
│   ├── README.md
│   ├── configuration.md     # 数据库配置与初始化
│   ├── sqlite-integration.md# SQLite 集成说明
│   └── table-management.md  # 表管理与维护
├── testing/                 # 测试与排查
│   ├── README.md
│   ├── offline-testing.md   # 离线功能测试流程
│   └── troubleshooting.md   # 常见问题排查
├── firebase-initialization.md# Firebase 初始化说明
├── model-type-compatibility.md # 模型类型兼容性说明
```

- 数据服务（Data Services）相关文档已迁移至 [`../services/README.md`](../services/README.md)
- 各子目录 README.md 介绍本类文档内容

## Documentation Purpose

Each document serves a specific purpose in the database development lifecycle:

1. **Core Documentation**: Provides fundamental concepts, patterns, and workflows
2. **Implementation Guides**: Details specific implementation techniques and configurations
3. **Testing and Troubleshooting**: Covers testing procedures and common issues

## Usage

1. Start with `core/development-workflow.md` to understand the overall process
2. Refer to `core/best-practices.md` for implementation guidelines
3. Use implementation guides for specific database technologies
4. Consult testing guides when developing or debugging database features

## Contributing

When adding new database documentation:
1. Place it in the appropriate subdirectory
2. Update this README if adding new categories
3. Ensure cross-references to related documents
4. Follow the existing documentation style 

## 类型统一出口和入口

> **强制要求：所有数据库相关类型（如 StorageType、DatabaseConfig、各实体类型等）必须通过 `src/core/lib/db/types/index.ts` 统一导入与导出。**
> 
> - 任何服务（如数据服务）、仓库、路由、控制器等都必须通过 types 层唯一出口引入类型，严禁跨目录直接 import 具体类型文件或重复造轮子。
> - 这样可确保全局类型一致性、避免命名冲突、提升可维护性，并便于 IDE 智能提示和类型跳转。
> - 代码引用建议：
>   ```typescript
>   import { User, StorageType, DatabaseConfig } from '@/core/lib/db/types';
>   ```
> - 新增/修改类型时只需维护 types 层，业务层零感知。

## 服务与路由的类型规范

- **服务层/数据访问层**：所有 service/仓库/核心业务逻辑模块，必须依赖 types 层导出的接口和类型，严禁自定义重复类型或绕开统一导出。
- **路由与 API 层**：所有 API handler、controller、路由参数校验等，必须用 types 层导出的接口和类型，禁止魔法字符串和重复声明。
- **复用原则**：如需扩展类型，仅在 types 层集中维护，禁止在服务、路由等下游层级“造轮子”。

## 最佳实践与常见错误

- 错误示例（禁止）：
  ```typescript
  // ❌ 直接 import 具体类型文件
  import { User } from '@/core/lib/db/types/user';
  // ❌ 在 service/router 里新定义 User 类型
  interface User { ... }
  ```
- 正确示例（推荐）：
  ```typescript
  // ✅ 统一从 types 层唯一出口导入
  import { User } from '@/core/lib/db/types';
  ```

## 维护建议

- 任何数据库类型、配置项扩展，优先在 types 层维护，业务层无需关心类型细节
- 统一类型出口后，项目升级和重构将极为简单，避免隐式 bug

## Mock 阶段数据服务设计（2025.04 更新）

### 设计目标
- 支持多种 mock 数据存储后端（memory/json/indexeddb/fake-indexeddb/sqlite），满足 Web/移动端/自动化测试等多场景需求。
- mock 阶段数据服务需与正式环境的数据访问接口保持一致，确保迁移和端到端测试零摩擦。
- 支持 schema 自动建表、config/types 下 mock 配置批量导入、演示数据快速加载。

### Mock 数据源类型
| mockMode         | 场景/说明                                                         |
|------------------|------------------------------------------------------------------|
| memory           | 纯内存，极简单元测试/演示                                        |
| json             | JSON 文件持久化，适合数据回归和 mock 数据备份                    |
| indexeddb        | 浏览器端本地存储，web 离线开发                                    |
| fake-indexeddb   | Node.js 环境模拟 IndexedDB，支持全 CRUD，便于 web/dev/prod 迁移   |
| sqlite           | Node.js 环境 SQLite，推荐移动端开发/测试，支持文件/内存两种模式   |

### 选择与切换方式
- 通过 .env.mock 或环境变量 `MOCK_DB_MODE` 动态切换 mock 后端。
- SQLite 模式支持 `MOCK_SQLITE_FILE` 指定文件路径或 `:memory:` 内存数据库。
- mock-client.ts 构造参数优先级：传参 > 环境变量 > 默认值。

### 初始化与数据加载
- 各 mockMode 下，mock-client.ts 自动完成 schema 建表和 config/types 下 mock 配置批量导入。
- 支持批量导入用户、成长任务、皮肤、翻译等业务配置和演示数据。
- SQLite/fake-indexeddb 支持复杂表结构、事务和真实端一致的 CRUD 行为。

### 典型用例
- Web 端离线开发/测试：用 fake-indexeddb，模拟浏览器 IndexedDB。
- 移动端开发/测试：用 sqlite，提前验证表结构、SQL 兼容性和端到端数据一致性。
- 自动化测试/CI：用 memory 或 json，快速初始化和清理。

### 设计原则
- mock 数据服务接口与正式环境完全一致，便于 Registry/Factory/Hook 层无感切换。
- 支持多 mock 数据源并行开发和测试，便于团队协作。
- mock 阶段所有表结构和业务配置均自动化初始化，无需手工维护。

---

如需扩展新的 mock 后端，只需在 mock-client.ts 新增分支并完善初始化和批量导入逻辑即可。

## 数据服务说明（已迁移）

> **注意：数据服务（Data Services）相关设计与实现已完全迁移至 [`../services/README.md`](../services/README.md)。**
>
> - 原先位于 `src/core/lib/db` 目录下的数据服务已独立为单独架构层，详见“服务架构”文档。
> - 数据服务负责业务数据的聚合、转换与接口暴露，数据库层仅聚焦存储、类型与配置。
> - 如需了解数据服务的架构、环境适配、数据库适配器、Mock/Firebase/Better 适配器等内容，请参阅 [`docs/guides/architecture/services/README.md`](../services/README.md) 的“与数据库的关系”与“环境切换”章节。
> - 数据服务与数据库的解耦有助于提升系统可维护性与扩展性。

---

> **总结：类型统一出口和入口是大型项目数据库架构的基础保障，所有服务、仓库、路由等必须严格执行，禁止造轮子和重复声明。**