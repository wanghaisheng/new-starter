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

## 数据服务说明（已迁移）

> **注意：数据服务（Data Services）相关设计与实现已完全迁移至 [`../services/README.md`](../services/README.md)。**
>
> - 原先位于 `src/core/lib/db` 目录下的数据服务已独立为单独架构层，详见“服务架构”文档。
> - 数据服务负责业务数据的聚合、转换与接口暴露，数据库层仅聚焦存储、类型与配置。
> - 如需了解数据服务的架构、环境适配、数据库适配器、Mock/Firebase/Better 适配器等内容，请参阅 [`docs/guides/architecture/services/README.md`](../services/README.md) 的“与数据库的关系”与“环境切换”章节。
> - 数据服务与数据库的解耦有助于提升系统可维护性与扩展性。

---

> **总结：类型统一出口和入口是大型项目数据库架构的基础保障，所有服务、仓库、路由等必须严格执行，禁止造轮子和重复声明。**