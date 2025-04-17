# 数据服务设计文档

## 设计目标

- 提供统一的数据访问接口，屏蔽底层实现细节。
- 支持多种数据库后端（如 SQLite、IndexedDB、Mock 等），可根据环境灵活切换。
- 采用工厂、注册表、适配器等模式，保证架构解耦、可扩展、易维护。

---

## 目录结构

```
src/core/services-update/data/
├── adapters/      # 数据库适配器（如 IndexedDB、SQLite 等）
├── factory/       # 数据服务工厂（动态创建服务实例，根据配置选择后端）
├── registry/      # 数据服务注册表（统一管理服务实例，解耦获取方式）
├── types/         # 类型定义（接口、配置、类型约束等）
├── database-service.ts # 数据服务统一实现，依赖注入底层适配器
├── README.md      # 本设计文档
```

---

## 架构核心

### 1. 统一接口（IDataService）
- 所有数据服务实现均需遵循 `IDataService` 接口，保证业务层调用方式一致。
- 详见 `types/index.ts`。

### 2. 工厂模式
- 工厂根据环境变量或配置，动态选择合适的数据库适配器，并注入到 `DatabaseService`。
- 例如：开发环境用 IndexedDB，生产环境用 SQLite，测试环境用 Mock。

### 3. 注册表模式
- 所有数据服务实例统一注册到注册表，业务层通过注册表获取服务实例，实现解耦。

### 4. 适配器模式
- 每种数据库实现一个适配器，负责具体的数据操作逻辑。
- 适配器需实现统一接口，便于工厂和服务层调用。

---

## 环境配置与切换

- 支持通过环境变量（如 `NEXT_PUBLIC_DATABASE_ENV`）或配置对象，自动切换底层数据库实现。
- 配置项包括：同步开关、调试日志、后端类型、混合策略等，详见 `types/index.ts`。
- 工厂读取配置，自动选择并创建合适的服务实例。

---

## 业务层调用方式

业务层只依赖 `IDataService` 统一接口，无需关心底层数据库类型。

```typescript
import { createDataService } from './factory/data-service-factory';

const dataService = createDataService();
await dataService.initialize();
const user = await dataService.getUser('id123');
```

---

## 扩展与维护

- 新增数据库后端：只需实现适配器并在工厂注册。
- 新增配置项：在类型定义和工厂逻辑中补充即可。
- 业务层无需改动，保证高可维护性。

---

## 数据服务架构（Data Service Architecture）

本模块实现了统一的数据服务层，支持多种数据库后端（如 SQLite、IndexedDB），并通过工厂和注册表实现解耦与可扩展。

### 目录结构

- `types/`：统一接口与配置类型（IDataService, DataServiceConfig 等）
- `adapters/`：各类数据库适配器（如 SqliteDatabaseClient, IndexedDBDatabaseClient）
- `factory/`：工厂方法，动态创建数据服务实例
- `registry/`：服务注册表，支持多实例注册/获取

### 快速使用

#### 1. 配置与工厂

```typescript
import { DataServiceFactory } from './factory/data-service-factory';
import { DataServiceConfig } from './types';

const config: DataServiceConfig = {
  services: {
    data: {
      adapter: 'sqlite',
      options: {
        sqlite: { name: 'mydb.sqlite' }
      }
    }
  }
};

const dataService = DataServiceFactory.createService(config);
await dataService.initialize();
```

#### 2. 环境变量自动切换

无需传 config 时，工厂会根据 `NEXT_PUBLIC_DATABASE_ENV` 环境变量自动选择适配器：
- `sqlite`：使用 SqliteDatabaseClient
- `indexeddb`：使用 IndexedDBDatabaseClient
- `mock`：使用 MockDataService（预留）



#### 3. 注册表用法

```typescript
import { DataServiceRegistry } from '../registry/data-service-registry';

DataServiceRegistry.register('main', dataService);
const mainService = DataServiceRegistry.get('main');
```

#### 4. 业务层调用与事件示例

```typescript
// 基本 CRUD
const user = await dataService.findOne('users', 'id123');
await dataService.insert('users', { id: 'id124', name: '张三' });
await dataService.update('users', 'id124', { name: '李四' });
await dataService.delete('users', 'id124');

// 事件与缓存机制
mainService.on('insert', (entity) => {
  console.log('[event] 新数据插入：', entity);
});
mainService.on('update', (id, data) => {
  console.log('[event] 数据更新：', id, data);
});
mainService.on('delete', (id) => {
  console.log('[event] 数据删除：', id);
});

// 查询缓存演示
const cachedUser = await mainService.findOne('users', 'id124');
console.log('[cache] 查询缓存命中：', cachedUser);

// 资源销毁
await mainService.dispose();
```

### 扩展说明

- 新增适配器：实现 IDataService 并在工厂注册即可。
- 支持多实例：通过注册表可管理多个数据服务实例。
- 详细接口见 `types/index.ts`。
- 支持事件订阅（on/off/emit）、findOne/query 查询缓存与自动失效、懒加载与按需销毁。

### 单元测试建议

建议为工厂、注册表、各适配器补充单元测试，确保不同环境和配置下行为一致。

---

## 数据预加载服务（DataPreloadService）增强用法

### 1. 初始化与配置

```typescript
import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { DataPreloadService } from './preload/data-preload-service';
import { DataPreloadConfig } from './preload/types';

const hybrid = new HybridDatabaseClient({ /* ... */ });
const preloadConfig: DataPreloadConfig = {
  enabled: true,
  preloadTables: [
    { name: 'users', maxRecords: 20, priority: 1 },
    { name: 'messages', maxRecords: 50, cacheTTL: 10 * 60 * 1000, priority: 2, dependsOn: ['users'] },
    'matches' // 简写支持
  ],
  autoPreloadInterval: 5 * 60 * 1000,
  cacheTTL: 15 * 60 * 1000,
  preloadOnNetworkReconnect: true
};
const preloadService = DataPreloadService.getInstance(hybrid, preloadConfig);
```

### 2. 事件订阅/通知

```typescript
preloadService.on('preload:start', ({ table }) => console.log('开始预加载', table));
preloadService.on('preload:success', ({ table, data }) => console.log('预加载成功', table, data.length));
preloadService.on('preload:error', ({ table, error }) => console.error('预加载失败', table, error));
preloadService.on('cache:expired', ({ table }) => console.warn('缓存过期', table));
preloadService.on('network:online', () => console.info('网络恢复，自动触发预加载'));
preloadService.on('network:offline', () => console.info('网络断开'));
```

### 3. 主动刷新/清理缓存

```typescript
preloadService.refreshCache('users'); // 主动刷新 users 表
preloadService.clearCache('messages'); // 清理 messages 表缓存
preloadService.clearCache(); // 清空所有缓存
```

### 4. 获取缓存与状态

```typescript
const users = preloadService.getCachedData('users');
const status = preloadService.getStatus('users');
```

### 5. 结合前端状态管理

```typescript
preloadService.onCacheUpdate = (table, data) => {
  // 可同步到 Redux/MobX/Vuex 等
  // dispatch({ type: 'PRELOAD_UPDATE', table, data })
};
```

### 6. 表优先级/依赖/细粒度 TTL
- preloadTables 支持 priority、dependsOn、per-table cacheTTL。
- 先加载 priority 低的表，后加载高的。
- dependsOn 支持简单依赖（如 messages 依赖 users）。

---

## 离线专用表最佳实践（hybrid 适配器方案）

### 1. schema 配置规范

在表 schema 配置中加 `offlineOnly: true`，hybrid 适配器会自动将该表的所有 CRUD 路由到本地存储：

```typescript
export const MessageTableSchema = {
  name: 'messages',
  columns: {
    id: { type: 'string', primary: true },
    content: { type: 'string' },
    createdAt: { type: 'number' }
  },
  syncConfig: {
    offlineOnly: true // 关键配置
  }
};
```

### 2. 典型用法示例

```typescript
import { HybridDatabaseClient } from '../adapters/hybrid-database-client';

async function offlineTableUsageExample() {
  const hybrid = new HybridDatabaseClient({ /* ... */ });
  hybrid.setMode('offline');

  // 所有 messages 表操作只会落地本地，不会同步云端
  await hybrid.insert('messages', { id: 'msg1', content: 'hello', createdAt: Date.now() });
  const msg = await hybrid.findOne('messages', 'msg1');
  await hybrid.update('messages', 'msg1', { content: 'updated' });
  await hybrid.delete('messages', 'msg1');

  // 批量操作
  await hybrid.insert('messages', [
    { id: 'msg2', content: 'hi', createdAt: Date.now() },
    { id: 'msg3', content: 'hey', createdAt: Date.now() }
  ]);

  // 查询所有
  const all = await hybrid.query('messages');
  console.log('本地所有消息：', all);
}
```

### 3. 业务层建议
- 只需在 schema 配置中正确标记 `offlineOnly: true`，业务层无需关心底层存储细节。
- 推荐统一通过 hybrid 适配器实例进行所有表的 CRUD，利用 schema 灵活区分离线/同步表。
- 如需批量操作、分页、缓存、事件等，hybrid 适配器已支持，无需额外实现 OfflineStorageService。

### 4. 进阶校验

```typescript
function assertOfflineOnly(hybrid: HybridDatabaseClient, table: string) {
  const schema = hybrid.getSchema(table);
  if (!schema?.syncConfig?.offlineOnly) {
    throw new Error(`表 ${table} 未标记为 offlineOnly`);
  }
}
```

---
如需进一步扩展或定制，请参考各目录下的 README 和类型定义。

---

## 数据迁移服务（DataMigrationService）高级能力文档

### 1. 配置项与类型

```typescript
// 表级迁移配置
interface TableMigrationConfig {
  name: string;
  mapping?: Record<string, string>; // 字段映射
  filter?: (row: any) => boolean;   // 数据过滤
  transform?: (row: any) => any;    // 自定义转换
}

// 全局迁移配置
interface DataMigrationConfig {
  source: HybridDatabaseClient;
  target: HybridDatabaseClient;
  tables: (string | TableMigrationConfig)[];
  batchSize?: number;               // 每批迁移条数
  resumable?: boolean;              // 是否断点续传
  maxRetry?: number;                // 批量失败最大重试次数
  verify?: boolean;                 // 迁移后自动校验
  concurrency?: number;             // 并发迁移表数
  onLog?: (log: MigrationLog) => void;        // 日志回调
  onGlobalProgress?: (progress: GlobalProgress) => void; // 全局进度回调
  beforeMigration?: () => Promise<void> | void;
  afterMigration?: () => Promise<void> | void;
  beforeBatch?: (table: string, batchIndex: number) => Promise<void> | void;
  afterBatch?: (table: string, batchIndex: number) => Promise<void> | void;
  beforeRow?: (table: string, row: any) => Promise<void> | void;
  afterRow?: (table: string, row: any) => Promise<void> | void;
  onCancel?: () => void;
}
```

### 2. 主要能力说明

- **并发迁移**：concurrency 控制同一时刻并行迁移表数，提升性能。
- **任务暂停/恢复/取消**：pause/resume/cancel 方法，支持断点续传和任务终止。
- **字段映射/数据过滤/转换**：每表可配置 mapping、filter、transform，实现复杂数据结构适配。
- **批量迁移与失败重试**：batchSize 控制单批量，maxRetry 支持失败自动重试。
- **全局进度统计**：getGlobalProgress() 和 onGlobalProgress 回调，便于 UI 实时展示总进度。
- **多级钩子**：before/afterMigration、before/afterBatch、before/afterRow，灵活插入自定义逻辑（如脱敏、审计等）。
- **迁移校验**：verify=true 时自动校验源/目标数据量。
- **失败数据导出**：getFailedData(table) 导出迁移失败数据，便于人工修复或后续重试。
- **全过程日志**：getLogs() 查询全量迁移日志，onLog 实时回调。

### 3. 用法示例

```typescript
import { DataMigrationService, DataMigrationConfig, TableMigrationConfig } from './migration/data-migration-service';

const migrationConfig: DataMigrationConfig = {
  source, target,
  tables: [
    {
      name: 'users',
      mapping: { id: 'userId', name: 'username' },
      filter: row => row.active,
      transform: row => ({ ...row, migratedAt: Date.now() })
    },
    'logs'
  ],
  batchSize: 100,
  concurrency: 2,
  maxRetry: 2,
  verify: true,
  beforeMigration: () => console.log('即将开始迁移'),
  afterMigration: () => console.log('全部迁移完成'),
  onLog: log => console.log('[日志]', log),
  onGlobalProgress: gp => console.log('[全局进度]', gp)
};

const migrationService = new DataMigrationService(migrationConfig);

// 启动迁移
migrationService.migrateAll(progress => {
  console.log(`[${progress.table}] 进度: ${progress.migrated}/${progress.total}, 状态: ${progress.status}`);
});

// 可随时暂停、恢复、取消
// migrationService.pause();
// migrationService.resume();
// migrationService.cancel();

// 导出失败数据与日志
const failedRows = migrationService.getFailedData('users');
const logs = migrationService.getLogs();
```

### 4. 最佳实践建议

- 推荐结合全局进度与日志回调，实现 UI 端进度条、错误提示、迁移报告。
- 复杂表结构建议用 mapping/transform 明确字段映射与数据转换。
- 大批量数据建议开启并发迁移与批量重试，提升整体吞吐。
- 强烈建议对迁移失败数据进行导出与人工复核，确保数据一致性。
- 钩子函数可用于实现脱敏、审计、数据清洗等企业级场景。