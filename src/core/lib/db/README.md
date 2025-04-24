# 数据库架构与实现指南（2025-04-23 整理版）

## 1. 架构概述

项目采用分层架构，支持多环境数据存储和同步，所有类型统一出口，底层实现高内聚、强解耦：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现（底层连接与原生 API 封装）
│   ├── capacitor-sqlite/  # 移动端 SQLite 封装
│   ├── indexeddb/        # Web 端 IndexedDB 封装
│   ├── mock/             # Mock 环境实现
│   └── base-client.ts    # 客户端抽象基类
├── repositories/     # 数据访问层，聚合/复用 clients，实现业务数据访问
│   ├── adapters/     # 各数据源适配器，命名唯一明确（见下）
│   ├── registry/     # 仓储注册表，集中管理所有实例
│   └── factory/      # 工厂方法，自动注入 client 并注册
├── schema/           # 数据模型定义
└── types/            # 类型定义，唯一类型出口和入口
```

> **架构原则：**
> - clients/ 仅封装原生连接与基础操作，不含业务逻辑。
> - repositories/ 负责业务相关的数据访问逻辑，adapter 命名必须唯一且直接反映底层实现类型（禁止 local/cloud 等模糊命名）。
> - types/ 目录为唯一类型出口，所有类型定义与导出均通过 types/index.ts。
> - 数据服务聚合层已迁移至 db 目录外，db 仅聚焦底层存储与类型。

## 2. 存储类型与配置

- 所有数据库类型通过 `types/.ts` 中常量统一管理。
- 支持 memory、indexeddb、sqlite、supabase、firebase 等多种类型，环境变量动态切换。
- 离线/在线类型分别受 SUPPORTED_STORAGE_TYPES、SUPPORTED_OFFLINE_STORAGE_TYPES 控制。
- 配置加载与校验由 config-loader.ts 统一实现。

## 3. 仓储适配器命名规范（重要！）

- adapter 文件名和类名必须唯一且无歧义，直接反映其数据源/实现类型：
  - ✅ `user-repository-mock.ts` / `UserRepositoryMock`
  - ✅ `user-repository-indexeddb.ts` / `UserRepositoryIndexedDB`
  - ✅ `user-repository-sqlite.ts` / `UserRepositorySQLite`
  - ✅ `user-repository-supabase.ts` / `UserRepositorySupabase`
  - ✅ `user-repository-firebase.ts` / `UserRepositoryFirebase`
  - ✅ `user-repository-hybrid.ts` / `UserRepositoryHybrid`
- 禁止“local”“cloud”等模糊命名！
- 适配器均实现统一接口 `IBaseRepository<T>`，通过依赖注入持有 client。

## 4. 工厂/注册表自动选择策略

- 工厂/注册表根据 ENV_STAGE、DATA_MODE、providerType 自动选择和注册对应实现。
- 业务层/页面/服务 hooks 只通过注册表获取仓储实例，禁止直连工厂或具体实现。

### 选择示例：

```typescript
import { UserRepositoryMock } from './repositories/adapters/user-repository-mock';
import { UserRepositoryIndexedDB } from './repositories/adapters/user-repository-indexeddb';
import { UserRepositorySupabase } from './repositories/adapters/user-repository-supabase';
import { RepositoryRegistry } from './repositories/registry';

const envStage = process.env.ENV_STAGE;
const dataMode = process.env.DATA_MODE;

let userRepo;
if (envStage === 'mock') {
  userRepo = new UserRepositoryMock();
} else if (envStage === 'local' && dataMode === 'offline-only') {
  userRepo = new UserRepositoryIndexedDB(/* IndexedDBClient */);
} else if (dataMode === 'online-only') {
  userRepo = new UserRepositorySupabase(/* SupabaseClient */);
} else if (dataMode === 'hybrid') {
  // TODO: 实现 hybrid adapter
  // userRepo = new UserRepositoryHybrid(...);
  userRepo = new UserRepositorySupabase(/* fallback */);
} else {
  userRepo = new UserRepositoryMock();
}
RepositoryRegistry.register('user', userRepo);
```

## 5. 类型统一出口和入口的作用

- 所有数据库相关类型（如 StorageType、DatabaseConfig、实体类型等）都在 `types/` 目录集中定义与导出，唯一入口为 `types/index.ts`。
- 保证全局类型一致性，避免命名冲突，便于 IDE 智能提示和维护。

## 6. 平台特定实现（离线/在线存储分离）

### 6.1 离线存储（本地优先，断网可用）
- Web 平台：优先 IndexedDB 适配器（如 user-repository-indexeddb.ts）
- 移动端：优先 SQLite 适配器（如 user-repository-sqlite.ts）
- mock 环境：优先内存 mock 适配器（如 user-repository-mock.ts）
- 离线存储适配器需保证断网时可用、支持本地事务、后续可与云端同步

### 6.2 在线存储（云端为主，需联网）
- 推荐 Supabase、Firebase、Postgres 等云端适配器（如 user-repository-supabase.ts、user-repository-firebase.ts）
- 生产/开发环境优先云端适配器，保证数据一致性、实时性和备份能力
- 在线存储适配器需支持多端同步、权限控制、云端事务等

### 6.3 混合/同步模式
- hybrid 适配器（如 user-repository-hybrid.ts）支持本地与云端自动同步/切换，兼顾离线可用与云端一致性

> 适配器选择策略详见“工厂/注册表自动选择策略”章节。

---
> 详细环境与服务模式说明见 docs/guides/environment-modes.md、docs/guides/service-modes.md。
> 本文档已同步最新代码结构和类型实现，确保开发与维护一致性。
