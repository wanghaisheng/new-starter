# 数据服务设计文档（2025重构版）

---

## 一、架构模式与开发阶段选择

### 支持的三种核心模式

1. **纯在线（Online Only）**
   - 只依赖云端数据库（如 Supabase、远程 SQLite）。
   - 适合生产环境、强一致性需求。
2. **纯离线（Offline Only）**
   - 只依赖本地数据库（如 IndexedDB、Capacitor SQLite、MockClient）。
   - 适合 mock 阶段、本地开发、断网场景。
3. **混合模式（Hybrid）**
   - 同时支持本地和云端，自动切换/同步。
   - 断网时本地可用，联网后自动同步。

### 各开发阶段推荐模式

| 阶段       | 推荐模式   | Adapter/实现                  | 说明                              |
|------------|------------|-------------------------------|-----------------------------------|
| mock       | 纯离线     | mock-database-client          | 零配置自动 mock，开发体验最佳      |
| local      | 离线/混合  | indexeddb/sqlite/hybrid       | 支持本地存储，部分表可混合同步      |
| dev        | 混合/在线  | hybrid/supabase/sqlite        | 支持断网、自动降级、数据同步        |
| production | 混合/在线  | hybrid/supabase/sqlite        | 云端为主，断网自动降级本地，自动同步 |

> 环境变量（如 `MOCK_DB_MODE`、`ONLINE_DB`、`OFFLINE_DB`）决定工厂/注册表选择哪种 adapter。

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

### 1. 统一接口（IDataService）
- 所有数据服务实现均需遵循 `IDataService` 接口，保证业务层调用方式一致。

### 2. 工厂与注册表自动切换
- 工厂根据环境变量/配置，动态选择合适的 adapter 实例。
- 注册表统一注册和获取服务实例，业务/页面/hooks 仅通过注册表获取，禁止直接 new。

#### 示例代码：
```typescript
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
const dataService = DataServiceRegistry.getInstance(config);
await dataService.initialize();
```

### 3. mock-client 自动化
- mock 阶段自动加载所有 schema 和 mock 配置，动态建表与批量插入，无需手动维护表结构和 mock 数据。
- 支持所有表，mock 数据结构与真实数据库结构高度一致。

### 4. Hybrid/高级混合适配器
- 断网自动切换本地存储，联网后自动同步。
- 支持表级/数据级同步策略、冲突解决、同步队列、事件钩子等高级能力（见 advanced-hybrid-database-client.ts）。

### 5. 数据迁移与同步
- 提供 DataMigrationService，支持表级迁移配置、字段映射、数据过滤、批量迁移、断点续传、失败重试等。
- Hybrid/AdvancedHybrid 支持本地与云端数据迁移与同步，满足复杂业务场景。

---

## 四、最佳实践与扩展

- 业务层/hooks 只依赖 `IDataService` 统一接口。
- 禁止直接 new 或 Factory/Client 直连，全部通过 Registry 获取。
- mock/test 环境自动降级到 mock-client，无需手动切换。
- 新增 provider 只需实现 adapter 并注册，无需改动业务层。
- Hybrid/AdvancedHybrid 可应对复杂同步、冲突、表级策略等场景。

---

## 五、常见问题与决策理由

- 为什么只保留三种模式？—— 纯在线、纯离线、混合模式已覆盖所有主流需求，其他变体均可归入三者之一，架构简洁、易维护。
- 业务层如何解耦？—— 只依赖统一接口和 Registry，底层切换透明。
- 如何扩展新数据源？—— 实现 adapter 并注册到工厂/注册表，无需动业务代码。
- 如何做数据迁移？—— 用 DataMigrationService 配置迁移策略，Hybrid/AdvancedHybrid 支持本地与云端同步。

---

## 六、参考配置与代码片段

```typescript
// 注册表自动选择数据服务
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
const dataService = DataServiceRegistry.getInstance(config);
await dataService.initialize();
const user = await dataService.getUser('id123');

// HybridDatabaseClient 自动切换 online/offline
const hybridClient = new HybridDatabaseClient(config);
await hybridClient.initialize();
// 网络断开自动切换 offlineClient，恢复后自动同步
```

---

### 各开发阶段的存储供应商选择最佳实践

#### 1. mock 阶段
- **在线存储**：MockClient（推荐底层为 JSON 或 fake-indexeddb，便于迁移和测试）
- **离线存储**：memory、json、fake-indexeddb（Web）、mock-capacitor-sqlite（移动端）等
- **目的**：极致开发体验、无副作用、可随时重置、支持自动化测试

#### 2. dev/local 阶段
- **在线存储**：测试/沙箱环境的 Supabase、Firebase、远程 SQLite（避免污染生产数据）
- **离线存储**：IndexedDB（Web）、Capacitor SQLite（移动端）、本地 SQLite（桌面/Node）
- **目的**：模拟真实环境，支持离线调试，数据可持久化但易清理

#### 3. production 阶段
- **在线存储**：正式生产环境 Supabase、Firebase、云数据库、远程 SQLite
- **离线存储**：IndexedDB（Web）、Capacitor SQLite（移动端）
- **目的**：保证数据安全、实时性，断网可用，恢复后自动同步

#### 4. 推荐选择总览表

| 阶段       | 在线存储默认                 | 离线存储默认                |
|------------|-----------------------------|-----------------------------|
| mock       | MockClient (json/fake-indexeddb) | memory/json/fake-indexeddb  |
| dev/local  | 测试 Supabase/SQLite        | IndexedDB/Capacitor SQLite  |
| production | 生产 Supabase/SQLite        | IndexedDB/Capacitor SQLite  |

- 供应商选择由工厂/注册表通过环境变量（如 `MOCK_DB_MODE`、`ONLINE_DB`、`OFFLINE_DB`）自动切换。
- 推荐 mock 阶段采用 mock/fake adapter，dev/local 阶段采用测试环境真实 adapter，production 阶段采用正式 adapter。
- 保证 schema、mock config、表结构一致，便于各阶段数据迁移与切换。

---

### mock 阶段 MockClient 的实现与数据迁移最佳实践

#### 1. MockClient 背后的实现选型

- MockClient 作为 mock 阶段的“统一入口”，其底层可支持多种存储方式：
  - **内存（memory）**：数据仅存在于进程内存，适合自动化测试、重启即失。
  - **JSON 文件**：数据持久化为本地 JSON 文件，便于导出、导入、迁移。
  - **fake-indexeddb**：用 JS 实现的 IndexedDB mock，API 兼容真实 IndexedDB，适合 Web mock 环境。
  - **mock-sqlite**：sqlite 的内存或本地文件模式，适合模拟真实数据库。

- 推荐 mock 阶段优先用 **JSON 或 fake-indexeddb**：
  - JSON 便于数据导出、导入，适合迁移到 local/dev 阶段。
  - fake-indexeddb 兼容真实 API，迁移时 adapter 切换即可，无需数据重构。
  - 内存适合自动化测试，不适合需要数据持久化/迁移的场景。

#### 2. 数据迁移与兼容性

- mock 阶段的数据结构、表 schema、mock 数据应与 local/dev/production 阶段保持一致。
- mock 阶段如用 JSON/fake-indexeddb，local 阶段可直接用 IndexedDB/SQLite，数据迁移只需导入导出，无需重复建设。
- MockClient 可通过配置选择底层存储类型（memory/json/fake-indexeddb/sqlite），业务层完全透明。

#### 3. 避免重复建设的建议

- MockClient 设计为“多后端”，通过配置参数（如 `MOCK_DB_MODE`）选择底层存储。
- mock 阶段用的 schema、mock 数据、表结构与正式环境一致，迁移时无需重建。
- 数据迁移工具（如 DataMigrationService）支持 mock（json/fake-indexeddb）到本地 IndexedDB/SQLite 的数据迁移。

#### 4. 典型配置/用法示例

```typescript
// mock 阶段
const mockClient = new MockDatabaseClient({
  mode: 'json', // 或 'fake-indexeddb', 'memory', 'sqlite'
  file: './mock-data.json', // 仅 json/sqlite 模式需要
  schemaDir: './config/schema',
  mockDataDir: './config/types',
});

// local 阶段
const localClient = new IndexedDBDatabaseClient({
  schemaDir: './config/schema',
});

// 数据迁移
await DataMigrationService.migrate(mockClient, localClient);
```

> MockClient 背后推荐用 JSON 或 fake-indexeddb，可直接迁移到 local/dev 阶段，避免重复建设。只需保证 schema、mock config、表结构始终一致，adapter/底层存储可灵活切换。

---

如需详细用法、配置模板或迁移指南，请查阅各目录 README 和架构文档。

---

#### ⚠️ 动态注册与懒加载原则（强制要求）

- 所有 adapter/service 必须通过 Registry/Factory 延迟注册与实例化，严禁在模块顶层静态 new 或全局赋值。
- Registry/Factory 必须在每次 getDataService 时根据最新环境变量动态选择实现，支持运行时热切换。
- 禁止业务层、hooks 直接依赖具体 adapter 或工厂，必须统一通过注册表获取实例。
- 这样可避免静态加载导致的环境切换失效、测试副作用和全局状态污染，提升可维护性与测试隔离性。
- 推荐所有单元测试、自动化测试前先 reset/clear 注册表，确保测试隔离和无副作用。