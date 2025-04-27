# 数据服务设计文档（2025重构版）

> 本文档为 HeyTCM 项目数据服务（Data Service）分层及设计规范，配合 [../service-design-guidelines.md](../service-design-guidelines.md) 一起使用。
> - 业务服务设计规范详见 [../business/README.md](../business/README.md)
> - 基础服务设计规范详见 [../infrastructure/README.md](../infrastructure/README.md)

---

## 插件化注册表 + 工厂 + 适配器架构（强制要求）
- 数据服务必须采用“插件化注册表 + 工厂 + 适配器 + 接口”分层模式。
- 数据服务实例只能通过注册表（Registry）获取，禁止直接 new/Adapter/Factory。
- 支持多 provider/多实例/动态扩展/运行时注册，满足 mock/remote/hybrid/多品牌等需求。
- 注册表层应内置实例缓存，确保每类数据服务全局唯一（单例），避免重复创建和资源浪费。
- 支持运行时注册新 Adapter，满足插件化、A/B 测试、品牌定制等需求。

## 统一接口与类型安全
- 数据服务接口建议以 `IDataService` 命名，类型定义集中在 `types/` 目录。
- 注册表/工厂暴露的获取服务实例方法签名统一，推荐如下：
  ```typescript
  getProvider(
    type: string,         // provider 类型（如 mock/remote/hybrid）
    name?: string,        // 实例名，默认 'default'
    options?: object      // 其它扩展参数
  ): () => IDataService
  ```
  或
  ```typescript
  getService(name?: string, options?: object): IDataService
  ```
- hooks/页面/业务层只能通过注册表暴露的统一接口获取数据服务实例，严禁直接调用工厂、适配器或 new。
- 所有数据服务实例必须满足接口类型约束，便于类型推断、自动补全和团队协作。

## 标准数据服务接口方法（与 types/index.ts 保持一致）

> 统一采用 `findById(tableName, id)`，避免歧义。所有方法参数与返回值类型严格参照 `src/core/services/data/types/index.ts`。

```typescript
// 泛型 T extends BaseEntity = any
findById<T>(tableName: string, id: string): Promise<T | null>;
query<T>(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
create<T>(tableName: string, data: T): Promise<T>;
update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
delete(tableName: string, id: string): Promise<void>;

// 批量/事务方法
createMany<T>(tableName: string, data: T[]): Promise<T[]>;
updateMany<T>(tableName: string, ids: string[], updates: Partial<T>): Promise<number>;
deleteMany(tableName: string, ids: string[]): Promise<number>;
batch(tableName: string, operations: any[]): Promise<void>;
beginTransaction(): Promise<void>;
commitTransaction(): Promise<void>;
rollbackTransaction(): Promise<void>;

// 能力/状态方法
isInitialized(): boolean;
getStats?(): Promise<any>;
checkHealth?(): Promise<{ healthy: boolean; reason?: string }>;

// 其它常用方法
clear(): Promise<void>;
get(key: string): Promise<any>;
set(key: string, value: any): Promise<void>;

// 详见 src/core/services/data/types/index.ts
```

- 所有方法均为泛型，类型安全。
- query 的 options 类型为 QueryOptions，返回 QueryResult<T>。
- update 返回 void（如需返回更新后实体，需自定义实现）。
- 状态/能力方法建议统一用 isInitialized/checkHealth/getStats。
- findOne 仅为部分适配器的兼容实现，主接口为 findById。

---

## 类型安全与泛型
- 所有数据服务、工厂、注册表建议用泛型约束返回值和参数类型，提升类型推断和开发体验。
  ```typescript
  interface IDataService<T> { /* ... */ }
  class DataServiceRegistry<T> { /* ... */ }
  ```

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

## 目录结构建议（2025 推荐实践）

```text
src/core/services/data/
├── adapters/               # 仅聚合型/复合型适配器（Hybrid、AdvancedHybrid、MockHybrid、CustomCompositeAdapter等）
│   ├── hybrid-database-client.ts
│   ├── advanced-hybrid-database-client.ts
│   ├── mock-hybrid-database-client.ts
│   ├── custom-composite-adapter.ts           # 如有自定义横切/多provider聚合
│   └── README.md
├── factory/                # 数据服务工厂，动态组合底层client与聚合适配器
│   └── data-service-factory.ts
├── registry/               # 全局注册表，统一管理数据服务实例
│   └── data-service-registry.ts
├── types/                  # 类型定义，DataServiceConfig、IDataService等
│   └── index.ts
├── utils/                  # 工具函数，如配置提取、同步辅助等
│   └── extractDatabaseConfig.ts
└── ...                     # 其它扩展目录

# 底层 client 统一放在 lib/db/clients 下
src/core/lib/db/clients/
├── indexeddb/indexeddb-client.ts
├── sqlite/sqlite-database-client.ts
├── supabase/supabase-client.ts
├── firebase/firebase-client.ts
├── ...
```

> **说明：**
> - 适配器层只保留聚合型/复合型适配器，单一 provider 直接用 lib/db/clients 下的底层 client。
> - 工厂层负责根据环境变量/配置动态组合底层 client 与聚合型适配器。
> - 注册表层负责全局唯一实例管理、懒加载与日志。
> - 类型层统一定义所有配置和接口，便于类型安全和自动补全。
> - 工具层放置通用工具函数，便于聚合/同步等横切能力扩展。

如需扩展更多 provider 或高级策略，建议以单一职责、易扩展、易组合为原则，逐步演进。

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

## 三.2 缓存与同步环境变量设计说明

### 1. 缓存与同步相关环境变量

- `NEXT_PUBLIC_CACHE_PROVIDER`：主缓存实现类型（如 memory/redis/localstorage），决定 memoryCache/二级缓存的 provider。
- `NEXT_PUBLIC_TEMP_CACHE_PROVIDER`：临时/会话缓存实现类型（如 memory/redis/localstorage），适合 session/tab 级热数据。
- `CACHE_STRATEGY`：多级缓存策略（如 memory→offline→online），决定缓存层级与刷写机制。
- `EXPIRY_STRATEGY`：缓存失效策略（如 none/ttl/lru），影响缓存数据的生命周期与一致性保障。
- `OFFLINE_FALLBACK`：断网降级策略，决定是否自动切换到本地缓存/离线存储。
- `SYNC_STRATEGY`：同步主策略（如 offline-first/server-wins/client-wins/merge），影响同步行为与冲突解决。
- `SYNC_ENTITY_TYPES`：指定需要同步的本地表/实体类型，通常用于离线优先或多端数据同步场景。

### 2. 设计原则与落地建议

- 所有缓存/同步相关环境变量建议通过 ConfigService 读取，严禁硬编码，便于多端/多环境灵活切换。
- 工厂层（如 data-service-factory.ts）应根据上述变量动态选择缓存 provider、缓存层级、失效策略和同步策略。
- 适配器层（如 AdvancedHybridDatabaseClient）需支持 memoryCache/二级缓存/失效策略的注入，并暴露 flushMemoryToOffline 等主动同步能力。
- 推荐所有缓存 provider/策略实现均支持扩展，便于未来接入更多缓存/同步方案。

### 3. 分阶段渐进式能力

- **阶段 1**：仅支持 offlineStore ↔ onlineClient 同步，环境变量主要用来切换主 provider。
- **阶段 2**：引入 memoryCache（由 `NEXT_PUBLIC_CACHE_PROVIDER` 决定），支持主动/定时 flush，失效策略由 `EXPIRY_STRATEGY` 控制。
- **阶段 3**：支持多端 cache-to-cache，同步策略可通过 `CACHE_STRATEGY`/`SYNC_STRATEGY` 配置。
- **阶段 4**：支持同步进度、冲突解决、日志等高级能力，相关变量可扩展。

### 4. 示例代码片段

```ts
import { getConfig } from '@/core/services/infrastructure/config/config-service';
const cacheProvider = getConfig('NEXT_PUBLIC_CACHE_PROVIDER');
const expiryStrategy = getConfig('EXPIRY_STRATEGY');
const cacheStrategy = getConfig('CACHE_STRATEGY');
const syncStrategy = getConfig('SYNC_STRATEGY');

// 工厂层根据变量动态注入缓存/同步策略
```

### 5. 注意事项

- 目前核心实现已支持多级缓存和同步调度，但部分环境变量尚未在工厂/适配器层完全落地，后续需补充动态分发逻辑。
- 建议所有新 provider/策略上线前，先补充相关环境变量与配置文档。

---
{{ ... }}

---

## 数据服务接口能力一览（演进式拆解 & 实现现状）

| 能力方法 | 说明 | 阶段 | 当前实现情况 |
|---|---|---|---|
| findById | 查询单条数据 | 基础 | 所有主流 Adapter 已实现 |
| query | 查询多条数据 | 基础 | 所有主流 Adapter 已实现 |
| create | 插入数据 | 基础 | 所有主流 Adapter 已实现 |
| update | 更新数据 | 基础 | 所有主流 Adapter 已实现 |
| delete | 删除数据 | 基础 | 所有主流 Adapter 已实现 |
| get/set | KV 读写 | 基础 | 多数 Adapter 已实现 |
| batch | 批量操作 | 标准化 | Hybrid/部分 Adapter 实现，部分 Adapter 待补全 |
| executeRawQuery | 原生查询 | 标准化 | 仅部分（如 Hybrid/Online）实现 |
| begin/commit/rollbackTransaction | 事务能力 | 标准化 | Hybrid/聚合/部分 Adapter 透传，部分未实现 |
| clear | 清理缓存/数据 | 标准化 | 多数 Adapter 实现 |
| isInitialized/initialize/disconnect | 初始化/断连 | 标准化 | 多数 Adapter 实现 |
| checkHealth | 健康检查 | 可观测性 | Hybrid/AdvancedHybrid/部分远端实现，部分 Adapter 待补全 |
| getStats | 运行状态/统计 | 可观测性 | 暂未统一实现 |
| getMetadata | 元数据能力 | 可观测性 | 暂未统一实现 |
| reset | 软重置 | 可观测性 | Hybrid/部分 Adapter 实现，部分 Adapter 待补全 |
| dispose | 资源释放 | 可观测性 | 多数 Adapter 实现，建议所有 Adapter 必备 |
| sync/syncToRemote/syncFromRemote | 多端同步 | 同步/分布式 | Hybrid/AdvancedHybrid 部分实现，具体同步逻辑待完善 |
| resolveConflict | 冲突解决 | 同步/分布式 | 暂未实现 |
| on/off | 事件订阅 | 事件驱动 | Hybrid/AdvancedHybrid/部分 Adapter 实现，类型签名待统一 |
| hasPermission | 权限校验 | 安全/权限 | 暂未实现 |

### 说明
- "当前实现情况" 基于 2025-04-25 代码库快照，后续如有更新请及时同步。
- 能力分阶段推进，建议优先补全高优先级能力（如 checkHealth、dispose、sync、reset、on/off 类型签名统一等）。
- 接口声明全部为可选（?），仅关键 Adapter 必须实现关键能力，保证灵活性与类型安全。

---

如需详细接口签名、各阶段落地建议或实现模板，请见 `/types/index.ts` 和各 Adapter 源码。

---

## 适配器设计原则与类型（2025 推荐实践）

### 1. 适配器层分工
- **聚合型/复合型适配器主导**：仅在需要多端同步、断网切换、多级缓存、复杂冲突等高级能力时，才在 adapters 层实现聚合型（如 Hybrid/AdvancedHybrid/MockHybrid/CustomCompositeAdapter）适配器。
- **单一 provider 场景**：如仅需本地或云端存储（IndexedDB、Sqlite、Supabase、Firebase 等），直接用 lib/db/clients 下的底层 client，无需再包一层“适配器壳”。
- **工厂层**：根据环境变量/配置动态选择底层 client 或聚合型适配器，业务层无需关心底层实现。

### 2. 典型适配器类型
- **HybridDatabaseClient**：本地（IndexedDB/Sqlite）+远程（Supabase/Firebase等）聚合，支持断网切换、同步、冲突检测。
- **AdvancedHybridDatabaseClient**：在 Hybrid 基础上增强多级缓存、同步调度、失效策略、复杂冲突解决等。
- **MockHybridDatabaseClient**：组合 mock、本地和远程能力，适用于开发、测试、演练环境。
- **CustomCompositeAdapter**：支持自定义 provider 多端聚合、横切扩展（如日志、埋点、加密、审计等）。

### 3. 能力横切点
- 断网自动降级（OFFLINE_FALLBACK）、多级缓存（CACHE_STRATEGY）、同步调度、冲突检测、横切扩展等，均推荐在聚合型适配器内统一实现。

### 4. 推荐实践
- 适配器层只保留聚合型/复合型适配器，单一 provider 直接用 lib/db/clients 下的底层 client。
- 工厂层负责动态组合底层 client 与聚合型适配器。
- 注册表层负责全局唯一实例管理、懒加载与日志。
- 类型层统一定义所有配置和接口，便于类型安全和自动补全。
- 工具层放置通用工具函数，便于聚合/同步等横切能力扩展。

> 详细能力与类型说明见 [adapters/README.md](./adapters/README.md)

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

---

## 五、各子模块与文档现状梳理（2025-04-25 检查）

### 1. adapters/ 适配器层
- **README.md**：已存在，详细说明了适配器设计原则、环境变量、聚合型与高级适配器类型。
- **advanced-hybrid-database-client.md/ts**：文档和实现均在，介绍多级缓存/同步/冲突解决能力。
- **base-database-client.ts / hybrid-database-client.ts / custom-composite-adapter.ts / client-registry.ts**：实现齐全。
- **建议**：如新增 provider 或横切能力，需同步补充文档。

### 2. factory/ 工厂层
- **README.md**：已存在，说明工厂职责、类型安全、热更新与横切能力注入。
- **data-service-factory.ts / sync-manager-options-factory.ts**：实现完整，支持多 provider、同步策略自动注入。

### 3. registry/ 注册表层
- **README.md**：已存在，说明全局实例管理、热更新、类型一致性。
- **data-service-registry.ts**：实现齐全。

### 4. sync/ 同步管理层
- **README.md**：已存在，详细介绍 SyncManager 多级缓存/同步链路、API、事件驱动、环境变量等。
- **base-sync-client.ts / sync-manager.ts**：实现完整。

### 5. migration/ 数据迁移层
- **README.md**：已存在，说明本地/多端/分库迁移场景与用法。
- **data-migration-service.ts**：实现齐全，支持批量迁移、字段映射、进度回调。

### 6. preload/ 预加载服务
- **data-preload-service.ts / usage-example.ts / types.ts**：实现齐全，支持数据预加载、类型定义与用例。
- **建议**：如有复杂预加载策略，可补充 README.md。

### 7. cache/ 缓存广播适配器
- **cache-broadcast-adapter.ts**：实现存在，支持多端 cache-to-cache。
- **建议**：如扩展缓存层/广播机制，建议补充说明文档。

### 8. utils/ 工具函数
- **extractDatabaseConfig.ts**：实现存在，支持多 provider 配置提取与特殊表名兼容。
- **建议**：如有更多通用工具，建议补充 utils/README.md。

### 9. types/ 类型定义
- **index.ts**：实现存在，涵盖 DataServiceConfig、IDataService 等核心类型。

---

## 六、近期文档与代码补全建议

- 各子模块文档基本齐全，adapters/factory/registry/sync/migration 层均有详细 README。
- cache/、utils/、preload/ 层如有新扩展建议补充 README。
- 如有新增 provider、同步策略、缓存机制、预加载场景等，务必同步更新相关子目录文档及本总览。
- **所有环境变量、配置项、横切能力建议统一在本文件及各子层 README.md 内同步说明。**

---

如发现文档与代码实现存在滞后或缺失，请在对应子目录及时补充 README 或用例说明，并在本文件“五、各子模块与文档现状梳理”中同步更新。

{{ ... }}