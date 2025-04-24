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
  - `NEXT_PUBLIC_DATABASE_ENV`：mock/local/dev/prod，决定当前运行阶段。
  - `NEXT_PUBLIC_DATA_MODE`：online/offline/hybrid，决定数据服务运行模式。
  - `NEXT_PUBLIC_ONLINE_DB`：指定在线存储供应商（如 supabase/firebase/sqlite）。
  - `NEXT_PUBLIC_OFFLINE_DB`：指定离线存储供应商（如 indexeddb/sqlite/memory）。
- 工厂优先读取 `DATABASE_ENV` 决定主阶段，`DATA_MODE` 决定优先模式，再根据 `ONLINE_DB`/`OFFLINE_DB` 选择具体 provider。
- 推荐所有 key 统一通过 config-keys.ts 管理，避免硬编码。

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

> ⚠️ 数据服务的统一接口、工厂与注册表、mock/混合适配器、迁移与同步等设计规范请统一参考 [../service-design-guidelines.md](../service-design-guidelines.md)。
> 
> **服务运行模式（Service Modes）与 provider/adapter 类型适配规范请统一参考 [../../docs/guides/service-modes.md](../../docs/guides/service-modes.md)。**

---
## 三.1 配置服务驱动的多环境/多供应商选择机制

### 1. 关键环境变量与配置项

- `NEXT_PUBLIC_DATABASE_ENV`：mock/local/dev/prod，决定主运行阶段。
- `NEXT_PUBLIC_DATA_MODE`：online/offline/hybrid，决定数据服务运行模式。
- `NEXT_PUBLIC_ONLINE_DB`：在线存储供应商（如 supabase/firebase/sqlite）。
- `NEXT_PUBLIC_OFFLINE_DB`：离线存储供应商（如 indexeddb/sqlite/memory）。

### 2. 工厂/注册表选择流程

1. **优先读取 `NEXT_PUBLIC_DATABASE_ENV`**，决定当前运行阶段（mock/local/dev/prod）。
2. **读取 `NEXT_PUBLIC_DATA_MODE`**，决定数据服务运行模式（online/offline/hybrid）。
3. **根据模式选择供应商**：
   - `online`：读取 `NEXT_PUBLIC_ONLINE_DB` 作为主 provider。
   - `offline`：读取 `NEXT_PUBLIC_OFFLINE_DB` 作为主 provider。
   - `hybrid`：两者都读取并组合为 HybridAdapter。
4. **所有环境变量均通过 ConfigService 统一读取，禁止硬编码。**

### 3. 推荐代码片段

```typescript
import { DB_KEYS, GENERAL_KEYS } from '@/core/services/infrastructure/config/config-keys';
import { configService } from '@/core/services/infrastructure/config';

const stage = configService.get(DB_KEYS.NEXT_PUBLIC_DATABASE_ENV); // mock/local/dev/prod
const mode = configService.get(GENERAL_KEYS.NEXT_PUBLIC_DATA_MODE); // online/offline/hybrid
const onlineProvider = configService.get(DB_KEYS.NEXT_PUBLIC_ONLINE_DB); // supabase/firebase/sqlite
const offlineProvider = configService.get(DB_KEYS.NEXT_PUBLIC_OFFLINE_DB); // indexeddb/sqlite/memory

// 工厂/注册表内部根据这些变量选择具体 adapter/provider
```

### 4. 配置与模式切换最佳实践

- 推荐所有页面、hooks、服务均通过注册表获取数据服务实例，禁止直接 new。
- mock/test 环境自动降级到 mock/fake adapter，无需手动切换。
- 新增 provider 只需实现 adapter 并注册，无需改动业务层。
- HybridAdapter 支持断网切换、本地缓存与自动同步。
- 配置项全部集中于 config-keys.ts，便于维护和统一管理。

---
## 三.2 环境模式、服务模式与数据初始化模式的集成

本节结合 [环境模式](../../../docs/guides/environment-modes.md)、[服务模式](../../../docs/guides/service-modes.md) 及 [数据初始化模式](../../../docs/guides/data-initialization-modes.md) 文档，说明如何在数据服务架构中实现多环境、多模式下的数据初始化与解耦。

### 1. 概念关联
- **环境模式（Environment Modes）** 决定当前整体运行环境（如 mock/local/dev/prod），影响数据服务的主模式和初始化行为。
- **服务模式（Service Modes）** 决定数据流转方式（online-only/offline-only/hybrid），决定 adapter/provider 的选择和切换。
- **数据初始化模式（Data Initialization Modes）** 决定不同阶段如何初始化数据（如 mock 数据、json/sql、云端拉取、自动重置等）。

### 2. 配置驱动的数据初始化策略
- 工厂和适配器根据 configService 读取环境变量，自动判断：
  - 当前环境阶段（如 mock 时自动全量 mock 数据初始化）
  - 当前服务模式（offline-only 时本地初始化，hybrid 时本地+云端同步）
  - 当前 provider 类型（mock/json/sql/云端）
- 推荐在每种模式下，adapter 内部或独立的 DataInitializationService 自动完成数据初始化。
- 支持“首次初始化/重置数据/导入导出/迁移”等操作，具体策略详见 [data-initialization-modes.md](../../../docs/guides/data-initialization-modes.md)。

### 3. 典型初始化流程

```typescript
import { configService } from '@/core/services/infrastructure/config';
import { DataInitializationService } from './data-initialization';

const env = configService.get('NEXT_PUBLIC_DATABASE_ENV');
const mode = configService.get('NEXT_PUBLIC_DATA_MODE');

await DataInitializationService.initialize({
  env,
  mode,
  provider: mode === 'online' ? configService.get('NEXT_PUBLIC_ONLINE_DB') : configService.get('NEXT_PUBLIC_OFFLINE_DB')
});
// 初始化完成后再实例化数据服务
```

### 4. 设计原则与最佳实践
- 数据初始化服务与数据服务解耦，但可由工厂/适配器自动调用。
- 初始化逻辑应支持多数据源（memory/json/sql/云端），并可配置化扩展。
- 推荐所有初始化配置、mock 数据、schema 均集中管理，便于迁移和切换。
- 详细初始化模式、流程、伪代码见 [data-initialization-modes.md](../../../docs/guides/data-initialization-modes.md)。

### 5. FAQ
- **Q: 数据初始化服务和数据服务模式如何协作？**
  - A: 工厂/适配器根据环境和服务模式选择初始化策略，初始化服务负责实际数据准备，二者解耦但协同。
- **Q: 支持哪些初始化方式？**
  - A: memory、json、sql、云端拉取、自动迁移等，详见初始化模式文档。
- **Q: 如何保证多端/多环境一致性？**
  - A: 所有配置、schema、mock 数据集中管理，adapter/初始化服务自动适配。

---
## 四、全局架构整合与数据服务设计的关键考量

本节总结数据服务设计在与客户端、服务端、业务初始化、仓储层等全局架构整合时需关注的关键点：

### 1. 客户端与服务端初始化服务的分层适配
- 客户端（如 PWA/移动端）专用 data-initializer 负责本地（IndexedDB/SQLite）等初始化，屏蔽端上差异。
- 业务/服务端 data-initializer 支持云端、混合、远程等复杂场景。
- 通用初始化逻辑可抽象为基类或工具，两端分别实现 adapter。

### 2. 初始化服务与数据服务的协作边界
- 初始化服务只依赖数据服务和仓储层，不直接操作底层数据库 client。
- 所有写入、建表、导入都走 repository，底层 provider 切换时初始化逻辑无需变动。

### 3. 多端/多环境一致性与幂等性机制
- 初始化流程具备幂等性（如检测已初始化则跳过）。
- mock 数据、schema、初始化脚本集中管理，保证多端一致。
- 支持“部分表/数据初始化”，便于增量导入和测试。

### 4. 配置驱动与自动降级/切换
- 所有初始化策略、数据源选择、adapter/provider 切换均通过 configService/环境变量集中管理，禁止硬编码。
- mock/测试环境下自动降级为 mock service，生产环境严格校验 provider。

### 5. 文档与最佳实践同步
- 初始化服务的调用链、解耦原则、适配策略等同步写入技术文档，维护 FAQ、用法示例。
- hooks 层、仓储层、数据服务层的协作关系建议补充到相关文档。

### 6. 测试与扩展性
- 初始化服务、数据服务、仓储层需具备 mock/本地/云端等多环境下的自动化测试用例，便于 CI/CD 和质量保障。

---
## 四、健康检查与异常上报机制

### 1. 能力说明
- 各 Adapter 实现 `checkHealth()` 方法，返回 `{ healthy: boolean, reason?: string }`，用于连接状态、schema 检查等。
- 注册表（DataServiceRegistry）统一暴露 `checkHealth(key)` 静态方法，可对任意已注册服务实例进行健康检查。
- 健康检查结果可用于 UI 状态展示、监控告警、自动降级等。

### 2. 典型用法
```typescript
const health = await DataServiceRegistry.checkHealth('main');
if (!health.healthy) {
  // 触发降级、提示用户或自动恢复
}
```

### 3. 扩展建议
- Adapter 可根据实际需求扩展健康检查内容（如 schema 版本、数据同步状态等）。
- 建议在 hooks 层、监控系统中集成健康检查结果。

---
## 五、mock 自动降级与多环境切换

### 1. 能力说明
- 工厂/注册表根据环境变量、配置或运行时检测，自动选择 mock、本地、云端等最合适的 Adapter。
- 支持开发、测试、离线、生产容灾等多阶段的 mock 降级与切换。

### 2. 典型用法
```typescript
// 注册表注册时自动选择 mock 或真实服务
DataServiceRegistry.register('user', () => {
  if (isMockEnv()) return new MockHybridDatabaseClient();
  if (isOfflineEnv()) return new IndexedDBDatabaseClient(...);
  return new SupabaseClient(...);
});
```
- hooks 层/页面无需感知底层数据源，直接通过注册表获取实例。

### 3. 配置驱动与降级策略
- 推荐所有环境变量、配置项集中管理，禁止硬编码。
- 支持运行时健康检查失败时自动 fallback 到 mock。

---
## 六、自动化测试与回归保障

### 1. 覆盖范围
- 覆盖注册表/工厂/适配器全链路，支持多环境、多 provider、mock/真实服务切换等场景。
- 健康检查、生命周期管理、mock 降级等核心能力均有自动化测试。

### 2. 运行方式
```bash
npx jest src/core/services/data/registry/data-service-registry.full.test.ts
```

---
## 七、FAQ与最佳实践

### Q1: 如何扩展新 Adapter/provider？
- 实现对应 Adapter，继承 BaseDatabaseClient 并实现 IDataService 接口。
- 在工厂注册新 Adapter，配置环境变量即可切换。

### Q2: mock 降级如何实现？
- 通过工厂/注册表自动检测环境，选择 mock 适配器。
- 支持运行时健康检查失败时自动降级。

### Q3: hooks/仓储层如何获取服务实例？
- 均通过 DataServiceRegistry.get(key) 获取，禁止直接 new。

### Q4: 健康检查结果如何集成到 UI/监控？
- 可在 hooks/useEffect 中定期调用 checkHealth，异常时触发 toast、弹窗或埋点。

---