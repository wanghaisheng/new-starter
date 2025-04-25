## 不同应用场景说明与应用范例

### 1. 本地数据库结构升级/迁移
适用于 IndexedDB/SQLite/WebSQL 等本地数据库结构升级、字段重命名、历史数据批量修正等场景。

**示例：本地表字段批量重命名**
```ts
import { DataMigrationService, DataMigrationConfig } from './data-migration-service';

const config: DataMigrationConfig = {
  source: localHybridClient,
  target: localHybridClient,
  tables: [
    {
      name: 'users',
      mapping: { oldField: 'newField' },
      transform: row => ({ ...row, newField: row.oldField })
    }
  ],
  batchSize: 100
};
const migrationService = new DataMigrationService(config);
migrationService.migrateAll();
```

### 2. 多端/多环境数据同步
适用于 Web/移动端、云端、本地等多环境间的数据批量迁移与同步。

**示例：本地数据批量迁移到云端**
```ts
const config: DataMigrationConfig = {
  source: localHybridClient,
  target: cloudHybridClient,
  tables: ['users', 'messages'],
  batchSize: 200,
  verify: true,
  onLog: log => console.log(log),
  onGlobalProgress: progress => console.log(progress)
};
const migrationService = new DataMigrationService(config);
migrationService.migrateAll();
```

### 3. 业务数据分库分表迁移
适用于业务规则变更、分库分表、历史数据归档、数据清洗等复杂批量迁移场景。

**示例：按条件过滤和自定义转换**
```ts
const config: DataMigrationConfig = {
  source: oldDbClient,
  target: newDbClient,
  tables: [
    {
      name: 'orders',
      filter: row => row.status === 'completed',
      transform: row => ({ ...row, migratedAt: Date.now() })
    }
  ],
  batchSize: 500
};
const migrationService = new DataMigrationService(config);
migrationService.migrateAll();
```

### 4. 断点续传与批量重试
适用于大批量数据迁移、网络不稳定、需断点续传和自动重试的场景。

**示例：开启断点续传与重试**
```ts
const config: DataMigrationConfig = {
  source: localHybridClient,
  target: cloudHybridClient,
  tables: ['logs'],
  batchSize: 1000,
  resumable: true,
  maxRetry: 5
};
const migrationService = new DataMigrationService(config);
migrationService.migrateAll();
```

---

## 数据服务不同演进阶段下的应用场景与代码范例

本项目的数据服务架构支持多阶段演进，开发者可根据业务所处阶段灵活选择最优模式与实现。

### 阶段 1：纯离线（Offline Only）
**应用场景：**
- 前端 mock、本地开发、离线优先移动端/桌面端
- 单元测试、自动化测试环境

**代码示例：**
```ts
import { MockHybridDatabaseClient } from '@/core/services/data/adapters/mock-hybrid-database-client';
import { DataPreloadService } from '@/core/services/data/preload/data-preload-service';

const mockClient = new MockHybridDatabaseClient();
const preloadService = DataPreloadService.getInstance(mockClient, { enabled: true, preloadTables: ['users'] });
preloadService.preloadAll();
```

### 阶段 2：纯在线（Online Only）
**应用场景：**
- 生产环境强一致性需求、只读/只写云端数据
- 轻量 Web App/管理后台

**代码示例：**
```ts
import { SupabaseClient } from '@/core/lib/db/clients/supabase/supabase-client';
import { DataServiceFactory } from '@/core/services/data/factory/data-service-factory';

const onlineClient = new SupabaseClient({ /* ... */ });
const dataService = DataServiceFactory.createService({
  mode: 'online',
  services: { data: { onlineProvider: onlineClient } }
});
```

### 阶段 3：混合模式（Hybrid）
**应用场景：**
- 支持断网可用、联网自动同步的应用
- 本地缓存+云端同步、复杂表结构

**代码示例：**
```ts
import { HybridDatabaseClient } from '@/core/services/data/adapters/hybrid-database-client';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { SupabaseClient } from '@/core/lib/db/clients/supabase/supabase-client';

const offlineClient = new IndexedDBClient({ dbName: 'localdb' });
const onlineClient = new SupabaseClient({ /* ... */ });
const hybrid = new HybridDatabaseClient({ /* config */ }, offlineClient, onlineClient);
```

### 阶段 4：高级混合/多端同步（Advanced Hybrid + Sync/Broadcast）
**应用场景：**
- 多端数据实时同步、缓存广播、冲突解决、链路调试
- 断点续传、批量重试、同步进度监控

**代码示例：**
```ts
import { AdvancedHybridDatabaseClient } from '@/core/services/data/adapters/advanced-hybrid-database-client';
import { SyncManager } from '@/core/services/data/sync/sync-manager';
import { getBestCacheBroadcastAdapter } from '@/core/services/data/cache/cache-broadcast-adapter';

const advancedClient = new AdvancedHybridDatabaseClient(
  {/* config */},
  memoryCache,
  offlineStore,
  onlineClient,
  new SyncManager({ client: offlineStore, entityTypes: ['users', 'orders'] }),
  networkManager,
  15 * 60 * 1000,
  ['users', 'orders'],
  getBestCacheBroadcastAdapter()
);
```

### 阶段切换与自动适配
- 推荐通过环境变量（如 `NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_ONLINE_DB_PROVIDER` 等）和配置服务自动切换不同阶段的实现，无需手动更改代码。
- 典型工厂用法见 data-service-factory.ts，支持多阶段自动适配。

> 每个阶段的 adapter/client 选择要与业务环境变量、部署目标、团队协作流程相匹配。推荐所有配置项集中于 config-keys.ts 和 configService，便于统一管理和切换。

---

如需详细讲解某一用法或需要中英文双语注释，请随时告知！

> 更多高级用法请参考源码注释和单元测试用例，或根据实际业务扩展 TableMigrationConfig 的 filter、mapping、transform 等能力。