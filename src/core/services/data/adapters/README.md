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

## 适配器类型规划

- **MockDatabaseServiceAdapter**：用于 mock 环境和测试，基于 FakeIndexedDB、内存、JSON 文件等。
- **SqliteDatabaseServiceAdapter**：本地 SQLite 数据库适配。
- **SupabaseDatabaseServiceAdapter**：云端 Supabase 数据库适配。
- **IndexedDBDatabaseServiceAdapter**：浏览器 IndexedDB 适配。
- **HybridDatabaseServiceAdapter**：聚合本地（IndexedDB/SQLite）与云端（Supabase/SQLite）能力，支持断网切换、同步。
- **AdvancedHybridDatabaseServiceAdapter**：多级缓存、自动同步、失效策略等高级场景。

## 阶段性适配器规划与演进说明

为适配产品和团队在不同阶段的需求，建议按以下三阶段进行适配器设计和演进：

### 阶段一：本地 Mock/IndexedDB/SQLite（0-1，开发和离线场景）
- 实现 MockDatabaseServiceAdapter、IndexedDBDatabaseServiceAdapter、SqliteDatabaseServiceAdapter。
- 适用于 mock、本地开发、断网等场景，无需后端依赖，接口快速迭代。
- 支持本地存储、内存 mock、自动化测试。

### 阶段二：本地+远程同步（1-10，成长/试运营）
- 增加 HybridDatabaseServiceAdapter，聚合本地（IndexedDB/SQLite）与远程（Supabase/Firebase）能力。
- 支持断网容灾：断网时自动切换本地，联网后自动同步数据。
- 实现基础的本地变更队列、同步调度，后续可增强冲突检测与解决。
- 工厂/注册表根据环境变量自动切换 hybrid 适配器，无需业务层关心底层细节。

### 阶段三：远程数据库/集中式服务为主（10-100，规模化/生产）
- 以 SupabaseDatabaseServiceAdapter、FirebaseDatabaseServiceAdapter 等远程适配器为主。
- 支持多端数据一致性、弹性扩容和高可用。
- 可保留本地降级/缓存能力，断网时自动降级到 hybrid/local。
- 配置服务统一管理 provider/adapter，确保环境切换自动化和类型安全。

> 阶段性适配器策略有助于团队从本地开发、mock、离线体验平滑演进到支持多端同步、弹性扩容和大规模生产，建议每一阶段的适配器均保持单一职责、易于扩展和组合。

## HybridDatabaseServiceAdapter 的定位与协作说明

### 为什么要单独有 HybridDatabaseServiceAdapter？
- **职责单一**：简单适配器（如 IndexedDB/Sqlite/Supabase）只负责单一 provider 的数据操作，接口纯粹，易维护。
- **聚合与编排**：HybridAdapter 专注于“本地+远程”聚合、断网切换、自动同步、冲突解决等高级策略，这些是单一适配器无法胜任的。
- **解耦与可扩展性**：HybridAdapter 内部组合和调用本地/远程适配器，便于替换和扩展底层实现。

### 协作方式
- HybridAdapter **内部组合**本地适配器（如 IndexedDB/Sqlite）和远程适配器（如 Supabase/Firebase）。
- 数据操作时，HybridAdapter 根据网络状态等自动路由到本地或远程。
- 同步时，HybridAdapter 负责本地变更队列、远程同步、冲突检测，底层读写由简单适配器完成。

**示例伪代码：**
```ts
class HybridDatabaseServiceAdapter {
  constructor(localAdapter, remoteAdapter) { ... }
  async create(data) {
    if (isOffline()) {
      return this.localAdapter.create(data);
    } else {
      await this.localAdapter.create(data);
      return this.syncToRemote();
    }
  }
}
```

### 如何区分用哪个适配器？
- 由工厂/注册表根据环境变量（如 `NEXT_PUBLIC_DATA_MODE`）自动选择：
  - `offline` → 本地适配器（IndexedDB/Sqlite）
  - `online`  → 远程适配器（Supabase/Firebase）
  - `hybrid`  → HybridAdapter（内部组合本地+远程）
- 业务层无需手动区分，统一通过工厂产物拿到数据服务即可。

> HybridAdapter 是为“离线可用+自动同步+断网容灾”场景而设计，聚合和编排本地/远程适配器，极大提升 PWA 等多端应用的用户体验和数据安全。

## AdvancedHybridDatabaseServiceAdapter 的定位与协作说明

### 为什么要有 AdvancedHybridDatabaseServiceAdapter？
- **更高级的聚合与优化**：在 HybridAdapter 的基础上，AdvancedHybridAdapter 增加多级缓存、自动同步调度、失效策略、批量同步、冲突自动合并等高级能力。
- **应对复杂业务与高并发场景**：适用于数据量大、端多、同步冲突复杂、需要高性能和高可用的生产环境。

### 协作方式
- AdvancedHybridAdapter 内部依然组合本地/远程等简单适配器，并可能组合多个缓存层（如内存缓存+本地数据库+远程云端）。
- 负责更智能的同步调度、缓存失效、批量同步、自动合并冲突等。
- 业务层依然只通过统一接口访问，无需关心底层多级缓存和同步细节。

**示例伪代码：**
```ts
class AdvancedHybridDatabaseServiceAdapter {
  constructor(memoryCache, localAdapter, remoteAdapter) { ... }
  async get(key) {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    const local = await this.localAdapter.get(key);
    if (local) {
      this.memoryCache.set(key, local);
      return local;
    }
    const remote = await this.remoteAdapter.get(key);
    if (remote) {
      this.localAdapter.set(key, remote);
      this.memoryCache.set(key, remote);
      return remote;
    }
    return null;
  }
  // ...更多高级同步与失效策略
}
```

### 如何区分用哪个？
- 依然由工厂/注册表根据环境变量（如 `NEXT_PUBLIC_DATA_MODE=advanced-hybrid`）自动选择。
- 业务层无需手动区分，统一通过工厂产物拿到数据服务即可。

> AdvancedHybridAdapter 适用于需要多级缓存、高性能同步、复杂冲突解决的高级场景，是面向大规模生产和高可用 PWA 的最佳实践。

## 工厂/注册表推荐用法

建议通过工厂或注册表模式，根据环境变量自动选择和实例化合适的数据服务适配器。例如：

```ts
function createDataServiceAdapter(config: DataServiceConfig): IDataService {
  const stage = process.env.NEXT_PUBLIC_ENV_STAGE;
  const onlineProvider = process.env.NEXT_PUBLIC_ONLINE_DB_PROVIDER;
  const offlineProvider = process.env.NEXT_PUBLIC_OFFLINE_DB_PROVIDER;

  if (stage === 'mock') {
    return new MockDatabaseServiceAdapter(config);
  }
  if (onlineProvider && offlineProvider) {
    return new HybridDatabaseServiceAdapter(config);
  }
  if (onlineProvider === 'supabase') {
    return new SupabaseDatabaseServiceAdapter(config);
  }
  if (offlineProvider === 'indexeddb') {
    return new IndexedDBDatabaseServiceAdapter(config);
  }
  // ...更多分支
  throw new Error('No valid data service adapter found for current environment');
}
```

## 目录结构建议（2025 推荐实践）

为支持多 provider、多实现方式、多 ORM 适配器的长期演进，建议采用“分子目录聚合结构”：

```
src/core/services/data/adapters/
  mock/
    memory.ts                // 基于内存的 mock 实现
    json.ts                  // 基于 JSON 文件的 mock 实现
    fakeindexeddb.ts         // 基于 fake-indexeddb 的 mock 实现
    index.ts                 // 聚合导出，工厂/注册表只依赖该入口
  sqlite/
    drizzle.ts               // Drizzle ORM 实现
    typeorm.ts               // TypeORM 实现
    index.ts
  supabase/
    index.ts
  hybrid/
    index.ts
  advanced-hybrid/
    index.ts
  ...（其它 provider 按需扩展）
```

- 每种 provider/adapter 独立目录，便于扩展和维护。
- index.ts 聚合导出，工厂/注册表只依赖统一入口，业务层无需关心底层实现。
- 支持多端、多 ORM、长期演进和团队协作场景。

> 旧的“全部平铺”结构已不推荐，建议逐步迁移到分子目录聚合结构。

## 参考
- [环境变量说明](../../../docs/guides/environment-variables.md)
- [数据服务分层设计说明](../README.md)

本目录为数据服务分层架构的核心，建议仅实现 provider 适配器与聚合/高级策略适配器，避免“表 × provider”式的重复实现。