# 离线存储与同步框架

这个模块提供了离线存储和与远程服务器同步的框架，支持在不同环境（mock, local, production）下使用一致的数据同步机制。

## 功能特点

- **离线优先设计**: 应用可以在无网络连接的情况下完全运行
- **自动同步**: 当网络恢复时自动同步数据
- **冲突解决**: 内置多种冲突解决策略
- **跨环境支持**: 在开发、测试和生产环境中使用相同的数据模型和同步逻辑
- **可扩展性**: 易于扩展和自定义

## 目录结构

```
src/core/lib/db/sync/
├── sync-manager.ts       // 同步管理器主类
├── sync-scheduler.ts     // 同步调度和计划执行
├── conflict-resolver.ts  // 冲突解决策略
├── README.md             // 本文档
```

## 主要组件

### 同步标志 (Sync Flags)

在 `src/core/lib/db/types/sync-flags.ts` 中定义了同步所需的类型和接口:

- **SyncState**: 表示实体当前同步状态的枚举 (NEW, MODIFIED, DELETED, SYNCED, CONFLICT, FAILED)
- **SyncPriority**: 表示同步优先级的枚举 (HIGH, MEDIUM, LOW, MANUAL)
- **ConflictResolution**: 表示冲突解决策略的枚举 (CLIENT_WINS, SERVER_WINS, MERGE, MANUAL)
- **SyncMetadata**: 包含同步状态、时间戳和其他元数据的接口
- **SyncConfig**: 表示同步配置的接口，包括新增的 `offlineOnly` 标记

### 离线专用存储 (Offline-Only Storage)

新特性: 通过在 `SyncConfig` 中设置 `offlineOnly: true` 可以标记某些表为"离线专用"，不会同步到云端:

```typescript
const offlineNotesSchema: TableSchema = {
  name: 'offline_notes',
  syncConfig: {
    enabled: true,
    offlineOnly: true, // 关键标记，指示数据仅在本地存储
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    // 列定义...
  ]
};
```

标记为离线专用的表有以下特性:
- 永远不会被同步到远程服务器
- 自动标记为 `SyncState.SYNCED` 状态
- 不会出现在同步队列中
- 适合存储隐私数据、设备特定设置或本地缓存

详细用法请参见 `src/core/lib/db/docs/offline-storage-guide.md`。

### 可同步实体 (Syncable Entities)

在 `src/core/lib/db/types/base-entity.ts` 中定义的扩展类型:

- **SyncableBaseEntity**: 扩展了 BaseEntity，添加了同步元数据
- **SyncableDatabaseRecord**: 包含同步信息的数据库记录

### 同步管理器 (Sync Manager)

在 `src/core/lib/db/sync/sync-manager.ts` 中实现:

- 管理实体的同步状态
- 处理自动和手动同步操作
- 监听网络连接状态变化

## 使用方法

### 基本配置

在 `.env.development` 文件中配置同步行为:

```
# 启用离线存储和同步
ENABLE_OFFLINE_STORAGE=true
SYNC_AUTO_ON_CONNECT=true
SYNC_INTERVAL=60000
SYNC_DEFAULT_PRIORITY=medium
SYNC_CONFLICT_RESOLUTION=server-wins
```

### 初始化同步管理器

```typescript
import { SyncManager } from 'src/core/lib/db/sync/sync-manager';
import { createNetworkManager } from 'src/core/lib/network/network-manager';
import { DatabaseClient } from 'src/core/lib/db/types/';

// 创建数据库客户端（示例）
const dbClient = createDatabaseClient();

// 创建网络管理器
const networkManager = createNetworkManager();

// 初始化同步管理器
const syncManager = new SyncManager({
  client: dbClient,
  networkManager,
  entityTypes: ['users', 'tasks', 'messages'],
  autoSyncOnConnect: true,
  syncIntervalMs: 60000 // 1分钟
});

// 开始自动同步
syncManager.startAutoSync();
```

### 标记实体为需要同步

```typescript
import { SyncState, SyncPriority } from 'src/core/lib/db/types/sync-flags';

// 获取实体
const user = await dbClient.findById('users', '123');

// 标记为已修改并需要同步
const syncableUser = syncManager.markForSync(user, SyncState.MODIFIED, SyncPriority.HIGH);

// 保存修改后的实体
await dbClient.update('users', '123', syncableUser);
```

### 手动触发同步

```typescript
// 触发所有待同步实体的同步
await syncManager.sync();
```

## 配合网络管理器使用

网络管理器提供了监控网络状态的功能，同步管理器会自动与其配合工作:

```typescript
// 模拟网络断开
networkManager.simulateOffline(true);

// 数据更改会在本地保存，但不会同步到远程

// 恢复网络连接
networkManager.simulateOffline(false);

// 同步管理器会自动开始同步（如果 autoSyncOnConnect 为 true）
```

## 支持的数据库客户端

同步框架设计为与多种数据库客户端兼容:

- **IndexedDB**: 浏览器端持久化存储
- **SQLite**: 移动应用本地存储
- **Mock数据库**: 开发和测试环境使用

无论使用哪种客户端，同步逻辑保持一致，确保跨环境的一致体验。

## 环境变量配置示例

```
# 通用同步配置
ENABLE_OFFLINE_STORAGE=true
SYNC_AUTO_ON_CONNECT=true
SYNC_INTERVAL=60000
SYNC_DEFAULT_PRIORITY=medium
SYNC_CONFLICT_RESOLUTION=server-wins

# 开发环境特定配置
SIMULATE_OFFLINE=false
SIMULATE_NETWORK_LATENCY=200

# 存储配置
STORAGE_ENGINE=indexeddb
INDEXEDDB_NAME=my-offline-app
INDEXEDDB_VERSION=1
```

## 最佳实践

1. **离线优先设计**: 设计应用时假设总是离线的，然后添加在线功能
2. **合理使用优先级**: 根据业务重要性设置同步优先级
3. **处理冲突**: 确保应用有明确的冲突解决策略
4. **测试离线场景**: 使用网络管理器模拟各种网络条件进行测试
5. **监控同步状态**: 在UI中提供同步状态指示器，让用户了解数据同步情况

## 扩展和定制

同步框架设计为可扩展的，可以通过以下方式进行定制:

- 添加自定义冲突解决策略
- 扩展SyncManager实现特定的同步逻辑
- 添加更多的同步事件和钩子

---

> ⚠️ 本模块所有环境模式（mock、local、dev、prod）与环境变量、同步策略等统一规范请参见 [../../../../docs/guides/environment-modes.md](../../../../docs/guides/environment-modes.md)。
> 
> - 推荐所有同步管理、脚本、配置等均遵循 environment-modes.md 说明，保证多环境切换和一致性。
> - 环境变量、配置示例、适配表等详见该文档。
> - 如有环境相关新需求，请优先补充 environment-modes.md。

---

## 服务模式与同步管理的适配

> 本节结合 [service-modes.md](../../../../../docs/guides/service-modes.md) 详细说明三种服务模式（online-only、offline-only、hybrid）下的数据初始化、同步行为、冲突处理与环境变量配置。

### 1. 三种模式下的同步策略

- **online-only（纯在线模式）**
  - 数据初始化后，所有表均默认进入同步队列，优先与云端保持一致。
  - 离线专用表（offlineOnly: true）不会同步，直接标记为 SYNCED。
  - 断网时部分功能受限，建议有降级提示。
- **offline-only（纯离线模式）**
  - 所有表仅本地存储，无任何远程同步。
  - 离线专用表与普通表行为一致。
  - 适合 mock、本地开发、隐私场景。
- **hybrid（混合模式）**
  - 普通表本地+云端同步，断网自动降级本地，联网后自动补同步。
  - 离线专用表始终仅本地。
  - 支持同步优先级、手动同步等高级策略。

### 2. 数据初始化与同步队列

- 初始化阶段（如首次安装/账号切换）会根据 schema 的 syncConfig、当前 DATA_MODE 环境变量，自动决定哪些表加入同步队列。
- 离线专用表初始化即标记为 SYNCED，不参与同步。
- 支持自定义初始化脚本、批量导入、迁移等。

### 3. 冲突解决与同步优先级

- 可为不同表/实体配置 SyncPriority、ConflictResolution 策略。
- hybrid/online-only 模式下可用 CLIENT_WINS、SERVER_WINS、MERGE 等策略。
- offline-only 模式下无冲突（本地唯一）。

### 4. 环境变量与配置建议

- 推荐统一用 `DATA_MODE` 或 `SYNC_MODE` 控制同步管理器行为。
- 可通过 .env、配置文件或运行参数传递。
- 详细模式/adapter 适配建议见 [service-modes.md](../../../../../docs/guides/service-modes.md)。

### 5. 场景举例

- hybrid 模式下，用户断网期间所有本地变更会积压在同步队列，联网后自动上云。
- online-only 模式下，数据实时推送云端，断网时部分功能只读或受限。
- offline-only 模式下，所有数据仅本地，适合草稿、隐私、临时缓存等场景。

---