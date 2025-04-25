# AdvancedHybridDatabaseClient 说明文档

## 一、定位与作用

`AdvancedHybridDatabaseClient` 是多级缓存与同步架构的核心实现，主要用于在现代 Web/移动/桌面应用中实现高性能、强一致性的数据管理。它整合了内存缓存、本地持久化存储与远程云端数据库，并通过灵活的同步与缓存策略，兼顾了性能、离线能力与数据一致性。

## 二、架构分层

- **1级缓存（memoryCache）**：
  - 进程内纯内存缓存（如 MemoryClient），极致性能，适合热数据。
  - 可由 cache provider 决定（memory、localStorage、sessionStorage、redis-cache 等）。
  - 支持失效、丢弃，不保证持久化。

- **2级缓存/主离线存储（offlineStore）**：
  - 持久化本地存储（如 IndexedDB、SQLite、Redis 持久化），断网可用。
  - 由 offline provider 决定，**必须保证持久化**。
  - 是 SyncManager 的同步对象，所有本地变更、待同步队列都落地在这里。

- **3级存储（onlineClient）**：
  - 远程数据库（如 Supabase、Firebase、Cloud SQLite、Turso 等），保证全局一致性。
  - 由 online provider 决定。

- **SyncManager**：
  - 只负责 offlineStore ↔ onlineClient 的同步。
  - 通过事件、定时器、网络监听等机制自动调度同步。

- **NetworkManager**：
  - 监听网络状态，自动触发同步或切换缓存模式。

## 三、核心功能

1. **多级缓存读写（优先级：内存 → 本地 → 云端）**
   - 读操作优先查 memoryCache，无则查 offlineStore，再查 onlineClient。
   - 写操作优先写 memoryCache 和 offlineStore，异步同步到 onlineClient。

2. **缓存失效与 TTL 管理**
   - 支持配置 cacheTTL，定期清理内存缓存，保障数据新鲜度。

3. **同步管理**
   - 通过 SyncManager 实现 offlineStore 与 onlineClient 的批量/增量同步。
   - 支持同步进度、冲突、异常等事件监听。

4. **cache-to-cache 能力（已支持多端自动适配）**
   - 多端/多进程 memoryCache 一致性（如多 tab、worker、Node 进程），通过广播/订阅机制刷新其它端缓存。
   - 已实现 ICacheBroadcastAdapter 统一接口，自动适配浏览器 BroadcastChannel、Node 进程通信，支持后续扩展 Redis Pub/Sub、Socket 等分布式场景。
   - 业务层无需关心具体实现，所有缓存广播/监听均自动完成。

5. **灵活配置与扩展**
   - 支持通过环境变量/配置项动态切换 provider、缓存策略、同步策略等。
   - 推荐所有自定义同步/冲突策略均通过 SyncManagerOptions 注入，避免硬编码，便于测试和多端适配。

## 四、典型用法

```ts
import { SyncManager, SyncConflictContext } from '../sync/sync-manager';

const db = new AdvancedHybridDatabaseClient({
  onlineType: 'supabase',
  entityTypes: ['users', 'posts', ...],
  // ...其它配置
}, memoryCache, offlineStore, onlineClient, new SyncManager({
  client: offlineStore,
  entityTypes: ['users', 'posts'],
  conflictResolver: (ctx: SyncConflictContext) => {
    // 自定义冲突解决逻辑
    return ctx.local.updatedAt > ctx.remote.updatedAt ? ctx.local : ctx.remote;
  },
  syncPriorityFn: (collection, allTypes) => {
    // 重要表优先
    return ['users', ...allTypes.filter(t => t !== 'users')];
  }
}), networkManager, 10 * 60 * 1000);

db.on('syncProgress', (progress) => { /* 进度上报 */ });
db.on('cacheUpdated', (event) => { /* cache-to-cache 事件 */ });
// 读写操作自动走多级缓存
```

## 五、扩展点与注意事项

- 推荐配合 SyncManager、NetworkManager 统一管理同步与网络切换。
- cache-to-cache 能力已支持多端自动适配，浏览器端优先用 BroadcastChannel，Node 端用进程间通信。
- 所有 provider/adapter 必须实现统一接口（IDataService）。
- 配置项建议通过环境变量集中管理，便于多端/多环境对齐。
- 所有同步/冲突/批量等策略均推荐通过 SyncManagerOptions 注入，便于解耦、测试和扩展。

## 六、事件驱动与 UI 联动示例

- 可通过 `db.on('syncProgress', ...)` 监听同步进度，`db.on('cacheUpdated', ...)` 监听缓存一致性事件，便于 UI 层实时反馈。
- 示例：

```ts
db.on('syncProgress', (progress) => {
  // 更新进度条、提示用户
});
db.on('cacheUpdated', (event) => {
  // 多端协作时自动刷新 UI
});
```

## 七、参考环境变量

- `NEXT_PUBLIC_CACHE_PROVIDER`
- `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`
- `NEXT_PUBLIC_ONLINE_DB_PROVIDER`
- `CACHE_STRATEGY`
- `SYNC_STRATEGY`
- `EXPIRY_STRATEGY`
- `SYNC_ENTITY_TYPES`

## SYNC_ENTITY_TYPES 环境变量说明

- **类型**：string（逗号分隔表名，如 `users,orders,logs`）
- **作用**：指定需要同步的本地表/实体类型，通常用于离线优先或多端数据同步场景。
- **示例**：
  ```env
  SYNC_ENTITY_TYPES=users,orders,logs
  ```
- **说明**：仅当启用 SyncManager 或类似离线同步机制时生效。未配置时，默认同步所有支持的表。

## 八、后续规划

- 支持更细粒度的同步事件与冲突处理（如字段级合并、分批同步等）。
- 增强与 UI/业务层的事件联动能力。
- 持续完善 cache-to-cache 机制，支持更多分布式场景（如 Redis、Socket 等）。

---

如需详细 API 说明或用例，请参考源码注释或补充需求！
