# 数据服务设计文档（2025重构版）

---

## 一、架构模式与开发阶段选择

### 支持的三种核心模式

1. **纯在线（Online Only）**
   - 只依赖云端数据库（如 Supabase、远程 SQLite、Firebase 等）。
   - 适合生产环境、强一致性需求。
2. **纯离线（Offline Only）**
   - 只依赖本地数据库（如 IndexedDB、Capacitor SQLite、MockClient）。
   - 适合 mock 阶段、本地开发、断网场景。
3. **混合模式（Hybrid）**
   - 同时支持本地和云端，自动切换/同步。
   - 断网时本地可用，联网后自动同步。

### 多供应商与环境阶段的选择机制

- 数据服务工厂和注册表通过配置服务（ConfigService）读取环境变量自动选择适配器和供应商。
- 主要环境变量：
  - `NEXT_PUBLIC_NODE_ENV`（运行环境，影响打包/调试/日志等）
  - `NEXT_PUBLIC_ENV_STAGE`（业务/部署环境，决定 API、provider、mock/真实等切换）
  - `NEXT_PUBLIC_DATA_MODE`：online/offline/hybrid，决定数据服务运行模式。
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`：指定在线存储供应商（如 supabase/firebase/sqlite）。
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`：指定离线存储供应商（如 indexeddb/sqlite/memory）。
  - `NEXT_PUBLIC_DB_ORM`：指定 ORM 类型（如 drizzle/none/prisma/typeorm），需与 provider 匹配，决定底层数据访问方式和自动建表、迁移等特性。
- 工厂优先读取 `NODE_ENV` 决定主阶段，`ENV_STAGE` 决定业务环境，`DATA_MODE` 决定优先模式，再根据 `ONLINE_DB_PROVIDER`/`OFFLINE_DB_PROVIDER` 选择具体 provider，同时根据 `DB_ORM` 选择 ORM 实现及相关能力。
- 推荐所有 key 统一通过 config-keys.ts 管理，避免硬编码。

### 各开发阶段推荐模式

| 阶段       | 推荐模式   | Adapter/实现                  | 说明                              |
|------------|------------|-------------------------------|-----------------------------------|
| mock       | 纯离线     | mock-database-client          | 零配置自动 mock，开发体验最佳      |
| local      | 离线/混合  | indexeddb/sqlite/hybrid       | 支持本地存储，部分表可混合同步      |
| dev        | 混合/在线  | hybrid/supabase/sqlite        | 支持断网、自动降级、数据同步        |
| production | 混合/在线  | hybrid/supabase/sqlite        | 云端为主，断网自动降级本地，自动同步 |

> 环境变量（如 `NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_ONLINE_DB_PROVIDER`、`NEXT_PUBLIC_OFFLINE_DB_PROVIDER`）决定工厂/注册表选择哪种 adapter。

---

## 二、目录结构与职责分工

```
src/core/services/data/
├── adapters/      # 各类数据库适配器（每种 provider 一个，单一职责）
│   ├── mock-database-client.ts
│   ├── sqlite-database-client.ts
│   ├── indexeddb-database-client.ts
│   ├── supabase-client.ts
│   ├── capacitor-sqlite-client.ts
│   └── hybrid-database-client.ts   # 混合/聚合适配器
├── factory/       # 数据服务工厂，根据环境动态创建实例
├── registry/      # 数据服务注册表，统一管理/获取服务实例
├── types/         # 类型定义（接口、配置、类型约束等）
├── database-service.ts # 统一实现，依赖注入底层适配器
├── README.md      # 本设计文档
```

- **Adapter**：每种 provider/模式一个 adapter，职责单一，易扩展。
- **Hybrid Adapter**：组合 offline/online adapter，实现自动切换/同步。
- **Factory**：读取环境变量/配置，动态实例化对应 adapter。
- **Registry**：全局唯一注册和获取数据服务实例。

---

## 三、核心实现与用法

> ⚠️ 数据服务的统一接口、工厂与注册表、mock/混合适配器、迁移与同步等设计规范请统一参考 [../service-design-guidelines.md](../service-design-guidelines.md)。
> 
> **服务运行模式（Service Modes）与 provider/adapter 类型适配规范请统一参考 [../../docs/guides/service-modes.md](../../docs/guides/service-modes.md)。**

---
## 三.1 配置服务驱动的多环境/多供应商选择机制

### 1. 关键环境变量与配置项

- `NEXT_PUBLIC_NODE_ENV`：运行环境，影响打包/调试/日志等。
- `NEXT_PUBLIC_ENV_STAGE`：业务/部署环境，决定 API、provider、mock/真实等切换。
- `NEXT_PUBLIC_DATA_MODE`：online/offline/hybrid，决定数据服务运行模式。
- `NEXT_PUBLIC_ONLINE_DB_PROVIDER`：在线存储供应商（如 supabase/firebase/sqlite）。
- `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`：离线存储供应商（如 indexeddb/sqlite/memory）。
- `NEXT_PUBLIC_DB_ORM`：指定 ORM 类型（如 drizzle/none/prisma/typeorm），需与 provider 匹配，决定底层数据访问方式和自动建表、迁移等特性。

### 2. 工厂/注册表选择流程

1. **优先读取 `NEXT_PUBLIC_NODE_ENV`**，决定当前运行环境（如 development、production）。
2. **读取 `NEXT_PUBLIC_ENV_STAGE`**，决定当前业务环境（如 mock、local、dev、prod）。
3. **读取 `NEXT_PUBLIC_DATA_MODE`**，决定数据服务运行模式（online/offline/hybrid）。
4. **根据模式选择供应商**：
   - `online`：读取 `NEXT_PUBLIC_ONLINE_DB_PROVIDER` 作为主 provider。
   - `offline`：读取 `NEXT_PUBLIC_OFFLINE_DB_PROVIDER` 作为主 provider。
   - `hybrid`：两者都读取并组合为 HybridAdapter。
5. **根据 `DB_ORM` 选择 ORM 实现**：决定底层数据访问方式和自动建表、迁移等特性。
6. **所有环境变量均通过 ConfigService 统一读取，禁止硬编码。**

### 3. 推荐代码片段

```ts
import { ConfigService } from '@/core/services/config';
import { DataServiceRegistry } from './registry/data-service-registry';
import { HybridDatabaseServiceAdapter, MockDatabaseServiceAdapter, SqliteDatabaseServiceAdapter, SupabaseDatabaseServiceAdapter } from './adapters';

const configService = new ConfigService();
const mode = configService.get('NEXT_PUBLIC_DATA_MODE');
const onlineProvider = configService.get('NEXT_PUBLIC_ONLINE_DB_PROVIDER');
const offlineProvider = configService.get('NEXT_PUBLIC_OFFLINE_DB_PROVIDER');
const orm = configService.get('NEXT_PUBLIC_DB_ORM');

if (mode === 'hybrid') {
  DataServiceRegistry.register('default', () => new HybridDatabaseServiceAdapter({ onlineProvider, offlineProvider, orm }));
} else if (mode === 'online') {
  DataServiceRegistry.register('default', () => new SupabaseDatabaseServiceAdapter({ provider: onlineProvider, orm }));
} else if (mode === 'offline') {
  DataServiceRegistry.register('default', () => new SqliteDatabaseServiceAdapter({ provider: offlineProvider, orm }));
} else if (process.env.NEXT_PUBLIC_ENV_STAGE === 'mock') {
  DataServiceRegistry.register('default', () => new MockDatabaseServiceAdapter({}));
}

const dataService = DataServiceRegistry.get('default');
```

---

## 四、最佳实践与注意事项

- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。
- 推荐所有环境变量 key 统一通过 config-keys.ts 管理，禁止硬编码。

---

## 参考
- [环境变量说明](../../../docs/guides/environment-variables.md)
- [服务模式与适配器规范](../../../docs/guides/service-modes.md)
- [数据服务适配器目录说明](./adapters/README.md)

本设计文档为数据服务分层与多环境/多 provider 适配的权威说明，所有团队成员开发前请务必通读。