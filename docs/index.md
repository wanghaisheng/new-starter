## 项目指南

- [项目初始化指南](./guides/project-initialization-guide.md) - 项目初始化的步骤和说明
- [开发流程指南](./guides/development-process-guide.md) - 项目开发流程的说明
- [Git分支策略](./guides/git-branch-strategy.md) - 项目Git分支策略的说明
- [后端数据服务最佳实践](./guides/backend-best-practices.md) - 项目中数据库表、服务的说明

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

数据库架构采用分层设计，支持多环境数据存储和同步：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现
│   ├── capacitor-sqlite/  # 移动端SQLite
│   ├── indexeddb/        # Web端IndexedDB
│   │   └── fake-indexeddb.ts  # 模拟IndexedDB的客户端离线存储
│   ├── mock/            # Mock环境实现（模拟远程数据存储）
│   └── base-client.ts   # 基础客户端抽象
├── repositories/     # 数据访问层
├── schema/          # 数据模型定义
├── types/           # 类型定义
└── service.ts       # 核心服务实现
```

存储策略：
- **开发阶段(Mock)**:
  - **远程数据存储模拟**: 使用 MockDatabaseClient (内存/JSON模式)，模拟服务器端数据
  - **客户端离线存储模拟**: 使用 MockIndexedDBClient (fake-indexeddb)，模拟浏览器的本地存储
  - 这种双层模拟策略与实际生产环境的架构一致，便于测试在线/离线场景
- **本地阶段(Local)**:
  - **Web离线存储**: 使用IndexedDB
  - **测试环境**: 使用fake-indexeddb模拟客户端离线存储
  - **移动端存储**: 使用SQLite
- **生产阶段(Production)**:
  - **远程存储**: Firebase/Supabase等云端服务
  - **本地离线缓存**: IndexedDB(Web)或SQLite(移动端)

同步策略：
- **在线优先**: 用户注册、个人资料更新
- **离线优先**: 消息、匹配操作
- **手动同步**: 批量数据同步、大文件传输
- **离线存储**: 本地数据，永不同步到云端

### 服务层架构

服务层采用分层架构：

```
UI组件层 (Components)
      ↓
服务层 (UserService, MessageService, 等)
      ↓
数据访问层 (DataServiceFactory → DatabaseService/MockDataService)
      ↓
存储层 (Repositories, SyncManager)
```

关键服务：
- **IDataService**: 数据服务统一接口
- **DatabaseService**: 主数据库服务实现
- **MockDataService**: 模拟数据服务
- **DataServiceFactory**: 数据服务工厂
- **OfflineStorageService**: 离线数据管理
- **StorageService**: 本地与云端存储
- **UserService/MessageService**: 领域服务实现

### API文档
- [数据库API文档](./guides/api/database-api.md) - 详细的数据库API使用说明和示例
- [数据库配置指南](./guides/database-configuration.md) - 详细介绍项目的数据库配置系统，包括环境支持和配置选项
- [SQLite数据库集成指南](./guides/database-sqlite-integration.md) - SQLite在移动应用中的配置、使用和最佳实践
- [数据库仓储模式实现指南](./guides/database-repository-pattern.md) - 详细介绍仓储模式的实现、最佳实践和近期优化 