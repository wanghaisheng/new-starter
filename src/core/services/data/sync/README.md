# 同步管理（SyncManager）设计说明

## 一、核心场景

同步管理器（SyncManager）用于协调多级缓存/存储体系下的数据一致性，适用于如下典型场景：

1. **离线优先/断网容灾**：用户可在离线状态下操作数据，变更先写入本地持久化（offlineStore），联网后自动同步到远程（onlineClient）。
2. **多级缓存一致性**：内存缓存（memoryCache）与本地持久化（offlineStore）之间的数据刷新、落地、失效与回收。
3. **多端/多进程同步**：同一账号在多端或多进程操作时，需确保本地与云端数据最终一致。
4. **批量同步与进度管理**：支持批量同步、同步进度上报、断点续传、冲突解决等高级能力。

## 二、分层同步链路

SyncManager 支持如下同步链路（可按需启用/扩展）：

### 1. memoryCache → offlineStore
- **场景**：
  - 进程内热数据写入 memoryCache 后，需定期/主动 flush 到 offlineStore，防止数据丢失。
  - 支持 TTL/LRU 失效时自动落地。
- **实现建议**：
  - 提供 `flushMemoryToOffline()` 方法，支持定时/手动/退出前 flush。

### 2. offlineStore ↔ onlineClient
- **场景**：
  - 断网时用户操作积压在 offlineStore，联网后自动同步到 onlineClient。
  - 支持批量同步、同步进度、冲突解决、断点续传。
- **实现建议**：
  - 提供 `syncOfflineToOnline()`、`syncAll()` 等方法，支持全量/增量同步。
  - 支持同步进度事件（onProgress）、冲突事件（onConflict）。

### 3. cache-to-cache（可选/进阶）
- **场景**：
  - 多进程/多端内存缓存一致性（如浏览器多 tab、Node.js 多 worker）。
  - 通过广播/订阅等机制刷新其它 cache 层。
- **实现建议**：
  - 提供 `broadcastCacheUpdate()`、`listenCacheUpdate()` 等机制。

## 三、设计策略

- **分层解耦**：每一级缓存/存储的同步职责清晰，SyncManager 只协调 offlineStore 与 onlineClient，memoryCache 通过 flush/失效机制与 offlineStore 保持一致。
- **配置驱动**：支持通过环境变量/配置项灵活启用/关闭各类同步链路。
- **事件驱动**：同步进度、冲突、异常等通过事件上报，便于 UI 反馈与业务处理。
- **可扩展性**：支持自定义同步策略、冲突解决策略、同步日志等。

## 四、典型 API 设计

```ts
interface SyncManager {
  // 内存缓存 flush 到本地持久化
  flushMemoryToOffline(): Promise<void>;
  // 本地持久化与云端同步
  syncOfflineToOnline(): Promise<void>;
  // 全链路同步（可选：memory→offline→online）
  syncAll(): Promise<void>;
  // 监听同步进度
  onProgress?: (progress: SyncProgress) => void;
  // 监听冲突事件
  onConflict?: (conflict: SyncConflict) => void;
  // ...其它高级能力
}
```

## 五、典型使用流程

1. 用户操作数据，优先写 memoryCache，同时触发 flush 到 offlineStore。
2. offlineStore 作为持久化主存，断网时积压所有变更。
3. 联网后，SyncManager 自动批量同步 offlineStore 到 onlineClient。
4. 同步过程支持进度上报、冲突解决、断点续传。
5. 多端/多进程场景可通过广播机制刷新 cache 层。

## 六、参考配置变量
- `NEXT_PUBLIC_ONLINE_DB_PROVIDER`
- `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`
- `CACHE_STRATEGY` / `cacheProvider`
- `SYNC_STRATEGY`
- `SYNC_ENTITY_TYPES`
- 详见 adapters/README.md

## 七、渐进式同步管理策略

同步管理的能力建议按业务复杂度和性能需求，分阶段渐进实现：

### 阶段 1：基础离线同步
- 仅实现 offlineStore ↔ onlineClient 的同步。
- 用户所有变更直接写入 offlineStore，断网时积压，联网后批量同步。
- 适用于轻量级 PWA、简单移动端应用。

### 阶段 2：加速缓存与主动 flush
- 引入 memoryCache（cache provider），提升读写性能。
- 内存缓存失效（TTL/LRU）或主动 flush 时写入 offlineStore，保障数据不丢失。
- 提供 flushMemoryToOffline 方法，支持定时/手动 flush。
- 适用于性能敏感、有热数据场景。

### 阶段 3：多端/多进程一致性
- 支持 cache-to-cache，同步多端/多进程 memoryCache 状态（如多 tab、worker）。
- 通过广播/订阅机制，保证各端缓存一致。
- 适用于协作类应用、复杂桌面/移动端。

### 阶段 4：高级同步能力
- 支持同步进度上报、断点续传、冲突解决、同步日志等。
- 可扩展自定义同步策略、数据合并规则。
- 适用于企业级、复杂业务场景。

> **建议**：优先实现阶段 1/2，随着业务复杂度提升逐步引入更高阶段能力，避免一次性过度设计。

---

> 本文档为多级缓存与同步管理的设计权威说明，具体实现细节请参考 `sync-manager.ts` 及相关适配器源码。

---

## 八、环境变量与同步服务的集成设计（2025 更新）

### 1. 关键环境变量说明

- `NEXT_PUBLIC_CACHE_PROVIDER`：决定 memoryCache/多级缓存的实现类型（如 memory/redis/localstorage），影响热数据的读写性能与一致性保障。
- `NEXT_PUBLIC_TEMP_CACHE_PROVIDER`：临时/会话缓存实现类型，适合 session/tab 级热数据隔离。
- `CACHE_STRATEGY`：多级缓存策略（如 memory→offline→online），决定缓存层级、刷写机制和同步链路。
- `EXPIRY_STRATEGY`：缓存失效策略（如 none/ttl/lru），影响 memoryCache 的生命周期与自动 flush 行为。
- `OFFLINE_FALLBACK`：断网降级策略，决定断网时是否自动切换到本地缓存/离线存储。
- `SYNC_STRATEGY`：同步主策略（如 offline-first/server-wins/client-wins/merge），影响同步优先级与冲突解决方式。
- `SYNC_ENTITY_TYPES`：指定需要同步的本地表/实体类型，通常用于离线优先或多端数据同步场景。

### SYNC_ENTITY_TYPES 环境变量

- **类型**：string（逗号分隔表名，如 `users,orders,logs`）
- **作用**：指定需要同步的本地表/实体类型，通常用于离线优先或多端数据同步场景。
- **示例**：
  ```env
  SYNC_ENTITY_TYPES=users,orders,logs
  ```
- **说明**：仅当启用 SyncManager 或类似离线同步机制时生效。未配置时，默认同步所有支持的表。

### 2. 设计落地与动态配置

- 所有同步相关环境变量建议通过 ConfigService 读取，严禁硬编码，便于多端/多环境灵活切换。
- SyncManager 及其依赖的适配器（如 AdvancedHybridDatabaseClient）需支持 memoryCache/失效策略/同步策略的动态注入。
- 工厂层（data-service-factory.ts）应根据上述变量动态组合缓存 provider、失效策略与同步链路。
- 典型用法：

```ts
import { getConfig } from '@/core/services/infrastructure/config/config-service';
const cacheProvider = getConfig('NEXT_PUBLIC_CACHE_PROVIDER');
const expiryStrategy = getConfig('EXPIRY_STRATEGY');
const cacheStrategy = getConfig('CACHE_STRATEGY');
const syncStrategy = getConfig('SYNC_STRATEGY');

// 在工厂/适配器层动态注入缓存与同步策略
```

### 3. 分阶段能力与环境变量的关系

- **阶段 1**：offlineStore ↔ onlineClient，同步主流程由 `SYNC_STRATEGY` 控制。
- **阶段 2**：memoryCache（由 `NEXT_PUBLIC_CACHE_PROVIDER` 决定）+ flush/失效策略（由 `EXPIRY_STRATEGY` 控制）。
- **阶段 3**：多端 cache-to-cache，同步策略通过 `CACHE_STRATEGY`/`SYNC_STRATEGY` 配置。
- **阶段 4**：同步进度、冲突解决、日志等高级能力，相关变量可扩展。

### 4. 进阶能力与扩展建议

- 支持同步进度、断点续传、冲突解决、同步日志等能力时，建议为每项能力预留专用环境变量（如 `SYNC_LOG_LEVEL`、`SYNC_CONFLICT_RESOLUTION`）。
- 推荐所有新 provider/策略上线前，先补充相关环境变量与配置文档。

---

## 九、高级能力与扩展实践

### 1. 推荐：同步/冲突策略均通过 SyncManagerOptions 注入

> **最佳实践**：所有自定义同步策略（如冲突解决、同步优先级、批量策略等）均应通过 `SyncManagerOptions` 注入，而非在 SyncManager 或 SyncClient 内部硬编码。
>
> 这样可实现：
> - 灵活适配不同业务场景（如本地优先、远端优先、字段级合并等）
> - 便于 mock 测试、自动化验证
> - 多端/多环境下可动态切换同步策略

#### 示例代码：

```ts
import { SyncManager, SyncConflictContext } from './sync-manager';

const syncManager = new SyncManager({
  client: mySyncClient,
  entityTypes: ['users', 'orders'],
  conflictResolver: (ctx: SyncConflictContext) => {
    // 示例：优先本地变更
    return ctx.local.updatedAt > ctx.remote.updatedAt ? ctx.local : ctx.remote;
  },
  syncPriorityFn: (collection, allTypes) => {
    // 示例：重要表优先
    return ['users', ...allTypes.filter(t => t !== 'users')];
  }
});
```

#### 说明：
- `conflictResolver`：自定义冲突解决回调，参数为冲突上下文（本地/远端数据、元信息等），返回最终合并结果。
- `syncPriorityFn`：自定义同步优先级/分批策略，参数为当前集合和全部实体类型，返回排序后的实体类型数组。
- 所有业务相关同步/冲突逻辑均应通过 options 注入，便于解耦和扩展。

---

## 十、常见问题与注意事项

- 参数命名如 collection/entityType/tableName 在不同实现中可细微差异，但类型兼容。
- 推荐所有同步、冲突、批量等策略均通过注入配置实现，避免硬编码。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档，避免文档与实现割裂。
- 推荐所有同步能力、缓存策略均支持扩展，便于未来接入更多同步/缓存方案。

---

> 本节为同步服务与环境变量集成的设计权威说明，具体实现细节请参考 `sync-manager.ts`、`base-sync-client.ts` 及相关工厂/适配器源码。

---

## 十一、如何调用同步管理器（SyncManager）

### 1. 推荐调用方式（工厂注入，配置驱动）

SyncManager 推荐通过工厂方法统一注入所有依赖（如同步 client、networkManager、provider 类型等），并由 DataServiceConfig 及其 options 字段动态生成所有同步相关参数。

#### SyncManagerOptions 的生成逻辑（工厂层最佳实践）

> **建议：SyncManagerOptions 必须由工厂层根据 DataServiceConfig 及 provider 类型动态推断和生成，避免硬编码。**

- 工厂方法应负责：
  - 解析 config.services.data 及其 options 字段，提取所有同步相关参数（如 entityTypes、autoSync、syncInterval、conflictResolver、syncPriorityFn 等）。
  - 解析 cacheProvider、tempCacheProvider、offlineProvider、onlineProvider 等 provider 类型，决定同步链路与能力。
  - 动态生成 SyncManagerOptions 并注入 SyncManager。
- 这样可确保同步管理器行为完全由配置驱动，支持多端/多级缓存/多种同步策略灵活切换。

##### 参考工厂实现示例：

```ts
function buildSyncManagerOptions(
  config: DataServiceConfig,
  syncClient: BaseSyncClient,
  networkManager: NetworkManager
): SyncManagerOptions {
  const options = config.services?.data?.options || {};
  const dataServices = config.services?.data || {};

  // 解析 provider 类型
  const cacheProvider = dataServices.cacheProvider || 'memory';
  const tempCacheProvider = dataServices.tempCacheProvider;
  const offlineProvider = dataServices.offlineProvider || 'indexeddb';
  const onlineProvider = dataServices.onlineProvider || 'rest';

  // 动态调整同步参数
  let entityTypes = options.entityTypes;
  let syncIntervalMs = options.syncInterval || 10 * 60 * 1000;
  let autoSyncOnConnect = options.autoSync ?? true;

  if (tempCacheProvider) {
    syncIntervalMs = Math.min(syncIntervalMs, 2 * 60 * 1000);
  }

  return {
    client: syncClient,
    entityTypes,
    networkManager,
    autoSyncOnConnect,
    syncIntervalMs,
    conflictResolver: options.conflictResolver,
    syncPriorityFn: options.syncPriorityFn,
  };
}
```

> 推荐所有调用 SyncManager 的业务代码均通过工厂方法和 buildSyncManagerOptions 工具函数生成 SyncManagerOptions，严禁手写硬编码参数。

#### 典型用法：

```ts
import { SyncManager } from './sync-manager';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import { buildSyncManagerOptions } from '@/core/services/data/factory/sync-manager-options-factory';

// 假设 config 为 DataServiceConfig，syncClient 为已实例化的 BaseSyncClient
const networkManager = getNetworkManager();
const syncManagerOptions = buildSyncManagerOptions(config, syncClient, networkManager);
const syncManager = new SyncManager(syncManagerOptions);

// 启动同步（自动/定时）
syncManager.start();

// 手动触发一次同步
await syncManager.sync();

// 监听同步进度/冲突事件
const unsubscribeProgress = syncManager.client.onSyncProgress(progress => {
  // 处理同步进度
});
const unsubscribeConflict = syncManager.client.onSyncConflict(conflict => {
  // 处理同步冲突
});

// 停止同步
syncManager.stop();
```

### 2. 参数与依赖说明

- **DataServiceConfig**：唯一权威配置入口，决定所有 provider、同步策略、缓存链路。
- **BaseSyncClient**：同步适配器，需通过工厂注入，支持多端同步能力。
- **NetworkManager**：网络状态监听器，建议通过统一工厂获取。
- **SyncManagerOptions**：所有同步相关参数均应通过 config/options 动态生成，避免硬编码。
- **Provider 类型**（cacheProvider、tempCacheProvider、offlineProvider、onlineProvider）：决定同步链路和能力，需在工厂层实例化并注入。

### 3. 推荐最佳实践

- 工厂方法负责解析所有 provider 类型、实例化 client/cache，并生成 SyncManagerOptions。
- SyncManager 只负责同步流程调度与事件监听，所有业务相关同步/冲突逻辑均通过 options 注入。
- 保持所有 sync 相关参数都通过唯一配置入口流转，便于维护和多端适配。

---

## 十二、SyncManagerOptions 生成与典型同步场景

SyncManagerOptions 的生成应结合业务所需的同步链路和场景，自动适配不同 provider 组合和同步需求。以下为几类典型场景及参数建议，并结合 buildSyncManagerOptions 给出代码演示：

#### 1. 离线优先（offlineStore → onlineClient）
- **场景**：用户断网时操作积压在 offlineStore，联网后自动批量同步到 onlineClient。
- **代码演示**：
```ts
const syncManagerOptions = buildSyncManagerOptions(config, syncClient, networkManager);
// 其中 config.services.data.offlineProvider = 'indexeddb', onlineProvider = 'rest' 等
const syncManager = new SyncManager(syncManagerOptions);
```

#### 2. 多级缓存同步（memoryCache/临时cache → offlineStore → onlineClient）
- **场景**：内存缓存/临时缓存热数据需定期 flush 到 offlineStore，offlineStore 再与 onlineClient 同步。
- **代码演示**：
```ts
const syncManagerOptions = buildSyncManagerOptions(config, syncClient, networkManager);
// config.services.data.cacheProvider = 'memory', offlineProvider = 'indexeddb', onlineProvider = 'rest'
const syncManager = new SyncManager(syncManagerOptions);
```

#### 3. cache-to-cache（多端/多进程一致性）
- **场景**：多 tab/worker 需同步 memoryCache 状态。
- **代码演示**：
```ts
const syncManagerOptions = buildSyncManagerOptions(config, syncClient, networkManager);
// config.services.data.cacheProvider = 'memory', 多端广播/订阅
const syncManager = new SyncManager(syncManagerOptions);
```

#### 4. 混合/高级同步（自定义链路与策略）
- **场景**：如本地优先/远端优先/字段级合并/分批同步等。
- **代码演示**：
```ts
const syncManagerOptions = buildSyncManagerOptions(config, syncClient, networkManager);
// config.services.data.options.syncPriorityFn、conflictResolver 可自定义注入
const syncManager = new SyncManager(syncManagerOptions);
```

> 工厂层应根据 DataServiceConfig 的 mode、provider 组合、options 字段，自动推断上述场景并生成最优 SyncManagerOptions。

---