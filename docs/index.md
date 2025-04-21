## 项目指南

- [项目初始化指南](./guides/project-initialization-guide.md) - 项目初始化的步骤和说明
- [开发流程指南](./guides/development-process-guide.md) - 项目开发流程的说明
- [Git分支策略](./guides/git-branch-strategy.md) - 项目Git分支策略的说明
- [后端开发规范](./guides/backend-development-standards.md) - 后端API开发、数据库访问、错误处理等规范
- [后端数据服务最佳实践](./guides/database-best-practices.md) - 项目中数据库表、服务的说明

- [导入路径规范](./guides/import-path-standards.md) - 规定使用 @/ 前缀绝对路径而非相对路径的导入规范
- [导入路径实施细节](./guides/import-path-enforcement-implementation.md) - 详细说明导入路径规范的实施措施和工具
- [导入路径更新摘要](./guides/import-path-updates-summary.md) - 导入路径更新的摘要信息
- [项目状态](./guides/project-status.md) - 项目的当前状态和进展
- [模型、类型与服务兼容性指南](./guides/model-type-compatibility.md) - 确保模型、类型和服务之间兼容性的最佳实践
- [避免开发中的Linter错误指南](./guides/avoiding-linter-errors.md) - 提供避免常见TypeScript错误的最佳实践，专注于类型安全和异步代码
- [添加新数据表指南](./guides/add-new-table.md) - 详细介绍如何向项目添加新的数据表并正确处理QueryResult类型
- [数据库配置指南](./guides/database-configuration.md) - 详细介绍项目的数据库配置系统，包括环境支持和配置选项
- [项目任务索引](../tasks/index.md) - 项目任务和进度的完整索引，包括前端、数据开发和测试进度
- [Shell脚本最佳实践](./guides/shell-scripting-practices.md) - 在项目中使用Git Bash脚本进行文件批量操作的最佳实践和示例
- [混合数据库客户端使用指南](./guides/hybrid-client-usage.md) - 如何配置和使用混合数据库客户端，实现离线优先和自动同步功能

## 测试摘要

- [项目测试摘要](./guides/test-summary.md) - 项目所有测试的覆盖率、通过率和关键测试结果
- [离线功能测试报告](./guides/offline-test-report.md) - 离线功能测试的详细报告和最佳实践
- [性能测试报告](./guides/performance-test-report.md) - 应用性能测试结果和优化建议
- [UI组件测试报告](./guides/ui-component-test-report.md) - UI组件测试覆盖率和测试方法
- [测试开发指南](./guides/lessons/test/readme.md) - 测试数据服务的架构、实现和使用指南

## 数据与架构

### 数据库架构

数据库架构采用多层分离设计，支持多端（Web/移动）、多环境（Mock/本地/生产）、多模式（离线/同步）灵活切换：

```
src/core/lib/db/
├── clients/             # 数据库客户端实现
│   ├── capacitor-sqlite/   # 移动端 SQLite 客户端
│   ├── indexeddb/          # Web 端 IndexedDB 客户端
│   ├── fake-indexeddb.ts   # 测试/Mock IndexedDB 客户端
│   ├── mock/               # Mock/内存数据库实现
│   └── base-client.ts      # 客户端基类抽象
├── repositories/        # 数据访问仓储层，封装所有表的 CRUD
├── schema/              # 数据模型与结构定义（TypeScript 类型 + 校验）
├── types/               # 通用类型定义（如 QueryResult、分页等）
├── sync/                # 数据同步管理（如 SyncManager、同步策略）
├── migration/           # 数据库迁移与版本管理（如 schema 升级）
```

**架构要点：**
- 所有环境（Mock/本地/生产）均通过统一接口访问数据库，页面/服务层无需关心实现细节。
- 支持多端存储（Web IndexedDB、移动端 SQLite）、Mock/测试环境自动降级。
- repositories 层实现表级/聚合级数据访问，解耦业务与存储。
- schema 层统一数据模型定义，便于类型校验与多端兼容。
- sync 层支持多种同步策略（在线优先/离线优先/手动同步等），适配复杂业务需求。
- migration 层管理数据库结构演进，支持平滑升级与回滚。

**典型场景：**
- Mock/测试环境：fake-indexeddb + mock 客户端，开发体验一致。
- Web 端：IndexedDB 持久化，支持离线优先。
- 移动端：Capacitor-SQLite，原生性能与本地存储。
- 生产环境：可接入 Firebase/Supabase 等云端存储，支持本地缓存与同步。

### 服务层架构

服务层采用分层架构，支持多业务服务、统一注册与动态切换、全量 hooks 调用：

```
src/core/services/
├── business/           # 业务服务（如用户、消息、命理分析、语音安全、壁纸生成等）
├── hooks/              # 所有业务 hooks，页面/组件仅通过 hooks 获取服务
├── data/               # 数据访问、仓储、同步等（如有）
├── infrastructure/     # 基础设施（如 registry、factory、providers、类型定义等）
│   ├── registry/       # 服务注册与切换
│   ├── factory/        # 服务工厂
│   ├── providers/      # 第三方服务适配
│   ├── types.ts        # 服务接口类型定义
│   └── ...
└── ...
```

- 所有页面/组件业务数据流必须通过 hooks，禁止直接 ServiceFactory/Service。
- hooks 返回值统一包含 loading、error、empty，异常处理与用户提示一致。
- 服务实例全部通过 Registry 注入，支持多环境切换与降级。
- 支持组合 hooks、Mock/测试环境自动降级。
- 新增业务服务（如命理分析、语音安全、壁纸生成等）均以独立目录和 hooks 实现，便于扩展与维护。

### API文档
- [数据库API文档](./guides/api/database-api.md) - 详细的数据库API使用说明和示例
- [数据库配置指南](./guides/database-configuration.md) - 详细介绍项目的数据库配置系统，包括环境支持和配置选项
- [SQLite数据库集成指南](./guides/database-sqlite-integration.md) - SQLite在移动应用中的配置、使用和最佳实践
- [数据库仓储模式实现指南](./guides/database-repository-pattern.md) - 详细介绍仓储模式的实现、最佳实践和近期优化 

# 项目知识体系导航

本项目文档体系采用分层结构，所有 guides 主题均采用“唯一权威入口 + 子领域导航”模式，详见 guides/README.md。

## 主题导航

- [架构设计（architecture）](./guides/architecture/README.md)
  - [数据库 (database)](./guides/architecture/database/README.md)
    - [核心设计](./guides/architecture/database/core/README.md)
    - [实现与配置](./guides/architecture/database/implementation/README.md)
    - [测试与排查](./guides/architecture/database/testing/README.md)
  - [服务层 (services)](./guides/architecture/services/README.md)
- [开发流程（development）](./guides/development/README.md)
  - [前端开发](./guides/development/frontend/README.md)
  - [后端开发](./guides/development/backend/README.md)
  - [初始化与环境](./guides/development/setup/README.md)
  - [开发流程与规范](./guides/development/workflow/README.md)
- [最佳实践（best-practices）](./guides/best-practices/README.md)
  - [数据库最佳实践](./guides/best-practices/database/README.md)
  - [性能优化](./guides/best-practices/performance/README.md)
  - [安全实践](./guides/best-practices/security/README.md)
- [部署与运维（deployment）](./guides/deployment/README.md)
  - [Web 部署](./guides/deployment/web/README.md)
  - [移动端部署](./guides/deployment/mobile/README.md)
  - [CI/CD 自动化](./guides/deployment/ci-cd/README.md)
- [测试（testing）](./guides/testing/README.md)
  - [集成测试](./guides/testing/integration/README.md)
  - [单元测试](./guides/testing/unit/README.md)
  - [端到端测试](./guides/testing/e2e/README.md)
- [工具与脚本（tools）](./guides/tools/README.md)
  - [自动化工具](./guides/tools/automation/README.md)

---

## 规范说明

- 每个 guides 主题目录下 README.md 为唯一权威入口，所有详细内容归档到子文档并在主文档导航中引用。
- 子目录仅有单一文档时已合并进上级 README.md，避免层级过深。
- 所有导航均为相对路径，便于本地与在线浏览。
- 历史讨论与头脑风暴内容已归档或删除，详见 guides/README.md “参考与补充说明”节。

---

如需详细结构与内容，请查阅 [guides/README.md](./guides/README.md)。