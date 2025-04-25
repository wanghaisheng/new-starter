# 数据服务适配器目录说明

本目录用于存放“数据服务层”的各类适配器，实现对不同数据库 Provider（如 SQLite、Supabase、IndexedDB、Mock 等）的统一封装和高级策略支持。

## 设计理念

- **解耦仓储与底层数据库实现**：仓储层（Repository）只依赖统一的数据服务接口（IDataService），不关心底层数据库类型、ORM、mock、同步等细节。
- **环境变量驱动**：通过环境变量（详见 docs/guides/environment-variables.md）动态选择合适的数据库 Provider 及适配器，无需改动业务代码。
- **聚合与高级策略**：适配器可实现多 provider 聚合、mock、同步、缓存、断网切换、自动同步、失效策略等高级能力。

## 典型环境变量

| 变量名                          | 作用                       | 示例值                |
|---------------------------------|----------------------------|-----------------------|
| NEXT_PUBLIC_ENV_STAGE           | mock/local/dev/prod        | mock                 |
| NEXT_PUBLIC_DB_ORM              | ORM 类型                   | drizzle/prisma/none   |
| NEXT_PUBLIC_ONLINE_DB_PROVIDER  | 线上数据库 provider        | supabase/sqlite/...   |
| NEXT_PUBLIC_OFFLINE_DB_PROVIDER | 离线数据库 provider        | indexeddb/sqlite/...  |
| CACHE_STRATEGY                | memory/localstorage/redis   | 多级缓存策略，决定缓存层级与实现          |
| OFFLINE_FALLBACK              | true/false                  | 断网自动切换，启用 hybrid/offline fallback |
| EXPIRY_STRATEGY               | none/ttl/lru                | 失效策略，缓存/数据过期处理方式           |
| SYNC_ENTITY_TYPES             | string（逗号分隔表名，如 `users,orders,logs`） | users,orders,logs |

> **说明：2025-04**
> 目前已为高级特性（如多级缓存、断网自动切换、失效策略等）增加了专用环境变量，详见上表。适配器如 AdvancedHybridDatabaseServiceAdapter 可通过这些变量实现自动化能力开关与策略配置，所有变量均已在 config-types.ts、config-keys.ts 及文档同步声明。

## 阶段性适配器规划与演进说明

为适配产品和团队在不同阶段的需求，建议按以下三阶段进行适配器设计和演进：

### 阶段一：本地 Mock/IndexedDB/SQLite（0-1，开发和离线场景）
- 实现 MockDatabaseClient、SqliteDatabaseClient。
- 适用于 mock、本地开发、断网等场景，无需后端依赖，接口快速迭代。
- 支持本地存储、内存 mock、自动化测试。

### 阶段二：本地+远程同步（1-10，成长/试运营）
- 增加 HybridDatabaseServiceAdapter，聚合本地（IndexedDB/SQLite）与远程（Supabase/Firebase）能力。
- **数据同步正是阶段二适配器的核心目标**，通过本地与远程聚合、断网自动切换与同步调度，满足成长/试运营阶段的多端数据一致性与可靠性需求。
- 实现基础的本地变更队列、同步调度，后续可增强冲突检测与解决。
- 工厂/注册表根据环境变量自动切换 hybrid 适配器，无需业务层关心底层细节。
- **同步能力推荐基于 src/core/lib/db/clients/sync/base-sync-client.ts 实现**：适配器可组合或继承 BaseSyncClient，专注于同步调度、变更队列、断网容灾、冲突解决等核心特性，提升多端一致性和可靠性。

### 阶段三：远程数据库/集中式服务为主（10-100，规模化/生产）
- 以 SupabaseDatabaseServiceAdapter、FirebaseDatabaseServiceAdapter 等远程适配器为主。
- 支持多端数据一致性、弹性扩容和高可用。
- 可保留本地降级/缓存能力，断网时自动降级到 hybrid/local。

## 复合型（聚合型/横切型）适配器类型与能力说明

根据 progressive-adapter-strategy.md 和环境变量配置，当前和未来支持的复合型适配器类型及其能力总结如下：

### 1. Hybrid（本地+远程混合适配器）
- **核心能力**：组合本地（IndexedDB/SQLite）与远程（Supabase/Firebase 等）client，支持断网切换、本地变更队列、自动同步。
- **典型变量**：
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`
  - `OFFLINE_FALLBACK`
- **场景**：PWA、移动端、需要离线可用和多端同步的业务。

### 2. AdvancedHybrid（多级缓存/复杂同步/冲突解决）
- **核心能力**：
  - 支持三层分明的多级缓存与存储：
    1. **1级缓存 memoryCache**：由 cache provider（如 memory、localStorage、sessionStorage、redis-cache 等）决定，纯内存/易失，极致性能，仅用于热点数据加速，允许失效和丢弃。
    2. **2级主离线存储 offlineStore**：由 offline provider（如 IndexedDB、SQLite、Redis 持久化等）决定，**必须持久化**，断网可用，是 SyncManager 的同步对象，所有本地变更、待同步队列都落地在这里。
    3. **3级远程存储 onlineClient**：由 online provider（如 Supabase、Firebase、Cloud SQLite、Turso 等）决定，保证全局数据一致性。
  - **SyncManager 只负责 offlineStore <-> onlineClient 的同步**，memoryCache 不参与同步。
  - **networkManager 监听网络状态**，自动触发同步与主存切换。
  - 支持失效策略（TTL/LRU）、批量同步、同步进度上报、断网降级等高级能力。
  - **cache-to-cache 能力（多端/多进程缓存一致性，2025+）**：
    - 支持 BroadcastChannel（浏览器）、localStorage event 或进程间通信（Node）实现 memoryCache 的多端广播与监听。
    - 变更 memoryCache 时自动广播，收到广播后刷新本地缓存。
    - 便于多 tab、worker、移动端等多实例场景下缓存一致性。
  - **典型用法与文档**：详见 [`advanced-hybrid-database-client.md`](./advanced-hybrid-database-client.md)
- **典型变量**：
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`
  - `CACHE_STRATEGY` 或 `cacheProvider`
  - `OFFLINE_FALLBACK`
  - `EXPIRY_STRATEGY`
- **场景**：PWA、移动端、需要极致性能与断网容灾、数据一致性的复杂业务。
- **设计原则**：
  - 各 provider 来源独立，不混用配置。
  - memoryCache 仅作加速缓存，offlineStore 为本地主存，onlineClient 为远端主库。
  - SyncManager 只认 offlineStore，不会操作 memoryCache。
  - cache-to-cache 能力推荐直接在 AdvancedHybridDatabaseClient 内实现广播/监听，SyncManager 无需感知。

### 3. MockHybrid（Mock+本地/远程聚合，测试/演练用）
- **核心能力**：组合 mock、本地和远程能力，支持开发、测试、演练环境的灵活切换。
- **典型变量**：
  - `NEXT_PUBLIC_DATA_MODE=mock`
- **场景**：前后端并行开发、自动化测试、CI/CD。

### 4. CustomCompositeAdapter（自定义横切/聚合能力）
- **核心能力**：可扩展组合任意 provider（如 D1+Turso+Supabase）、多种缓存/日志/队列等横切能力。
- **典型变量**：根据实际业务自定义 provider 变量（如 `NEXT_PUBLIC_D1_DB_URL`、`NEXT_PUBLIC_TURSO_DB_TOKEN` 等）。
- **场景**：业务特殊需求、跨多云/多数据源聚合。

### 复合型适配器的能力横切点
- **断网自动降级**（`OFFLINE_FALLBACK`）：远程不可用时自动切换本地，恢复后自动同步。
- **多级缓存**（`CACHE_STRATEGY`、`NEXT_PUBLIC_CACHE_PROVIDER`）：memory + local db + cloud。
- **同步调度/冲突检测**：聚合型适配器负责统一调度和冲突解决。
- **横切扩展**：如日志、埋点、加密、审计等都可通过复合型适配器统一管理。

### 工厂/注册表支持
- 通过环境变量动态组合适配器（如 hybrid/advanced-hybrid）。
- 支持 fallback、缓存策略、同步策略等配置驱动的横切能力。
- 业务层始终通过统一接口访问，底层切换透明。

如需扩展新的聚合/横切能力，建议以单一职责和组合优先为原则，保持适配器体系的可维护性和可扩展性。

## 适配器类型规划（2025 最新）

为满足多阶段业务需求与技术演进，当前适配器体系分为如下类型：

- **Mock/Sqlite/IndexedDB Client**：推荐直接复用底层 client（如 `MockDatabaseClient`、`SqliteDatabaseClient`、`IndexedDBClient`），无需在数据服务适配器中再包一层壳。
- **SupabaseDatabaseServiceAdapter**：云端 Supabase 适配器，支持实时同步与云端存储。
- **FirebaseDatabaseServiceAdapter**：云端 Firebase 适配器，支持实时同步与云端存储。
- **HybridDatabaseServiceAdapter**：本地（IndexedDB/SQLite）与远程（Supabase/Firebase）聚合，支持断网切换、同步、冲突检测。
- **AdvancedHybridDatabaseServiceAdapter**：在 Hybrid 基础上增强多级缓存、同步调度、失效策略、复杂冲突解决等。

> **说明：**
> 自 2025 年起，Mock、Sqlite、IndexedDB 等本地/单一 provider 推荐直接用 `src/core/lib/db/clients/` 下的底层 client，无需在数据服务适配器层再维护 `MockDatabaseServiceAdapter`、`SqliteDatabaseServiceAdapter`、`IndexedDBDatabaseServiceAdapter` 等壳。聚合型适配器可直接组合底层 client，结构更简洁、维护成本更低。

如需支持更多 provider（如 D1、Turso、TiDB），可扩展对应适配器。

## 适配器分层与职责说明

### 1. 单一 Provider 适配器
- **Mock/Sqlite/IndexedDB 等**：
  - 只负责与单一数据库或 provider 的 CRUD、事务、连接等交互。
  - 推荐直接用底层 client，无需再包一层壳。
  - 实现统一的 `IDataService` 或 `BaseClient` 接口，便于业务层和聚合适配器透明调用。
  - 适用于本地开发、纯离线、纯云端等单场景。

### 2. 聚合型/高级适配器
- **HybridDatabaseServiceAdapter**：
  - 组合本地和远程适配器，聚合多种 provider。
  - 负责断网切换、自动同步、本地变更队列、基础冲突检测。
  - 适用于成长/试运营阶段，满足一定的多端一致性和容灾需求。
- **AdvancedHybridDatabaseServiceAdapter**：
  - 在 Hybrid 基础上，增强多级缓存、同步调度、失效策略、复杂冲突解决等。
  - 支持三层缓存（memoryCache、offlineStore、onlineClient），详见上文。
  - 支持 cache-to-cache 多端缓存一致性能力（2025+）。
  - 推荐参考 [`advanced-hybrid-database-client.md`](./advanced-hybrid-database-client.md) 获取详细架构与用法说明。

### 3. 分层协作原则
- 所有适配器和底层 client 均实现统一 `IDataService` 或 `BaseClient` 接口。
- 工厂/注册表根据配置动态组合、切换实例，业务层无需关心底层实现。
- 聚合型适配器内部可灵活组合任意 provider，只需保证接口一致。

## SYNC_ENTITY_TYPES 环境变量

- **类型**：string（逗号分隔表名，如 `users,orders,logs`）
- **作用**：指定需要同步的本地表/实体类型，通常用于离线优先或多端数据同步场景。
- **示例**：
  ```env
  SYNC_ENTITY_TYPES=users,orders,logs
  ```
- **说明**：仅当启用 SyncManager 或类似离线同步机制时生效。未配置时，默认同步所有支持的表。

## 推荐目录结构（聚合型/复合型适配器主导）

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

## 参考
- [环境变量说明](../../../docs/guides/environment-variables.md)
- [数据服务分层设计说明](../README.md)

本目录为数据服务分层架构的核心，建议仅实现 provider 适配器与聚合/高级策略适配器，避免“表 × provider”式的重复实现。