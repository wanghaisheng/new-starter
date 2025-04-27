# 服务层运行模式（Service Modes）与 Provider/Adapter 命名规范

> 本文档为 HeyTCM 项目所有服务（数据、业务、基础设施、客户端等）在不同开发阶段、运行环境下的模式与 provider/adapter 类型命名与适配规范，避免歧义，提升一致性。请所有开发、文档、测试严格参照本规范。

---

## 一、全局运行模式（Mode）定义

| 模式（Mode）      | 英文标识        | 说明                                                         |
|-------------------|-----------------|--------------------------------------------------------------|
| 纯在线模式        | online          | 仅依赖云端/远程服务，适用于生产/强一致性/云优先场景。         |
| 纯离线模式        | offline         | 仅依赖本地存储/数据库，适用于 mock/弱网/本地开发/隐私场景。   |
| 混合模式          | hybrid          | 本地与云端并存，断网自动降级本地，联网自动同步。              |

- **环境变量建议（与最新规范同步）**：
  - `NEXT_PUBLIC_NODE_ENV=development|production|test`  // 基础构建/运行环境，影响打包、调试、日志等
  - `NEXT_PUBLIC_DATA_MODE=online|offline|hybrid`
  - `NEXT_PUBLIC_ENV_STAGE=mock|local|dev|prod`
  - `NEXT_PUBLIC_PLATFORM=web|mobile`
  - `NEXT_PUBLIC_CONFIG_PROVIDER=local|remote`
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase|firebase|sqlite`
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER=indexeddb|sqlite|memory`
  - 详见《环境变量配置指南》。

---

## 二、Provider/Adapter 类型命名规范

| 类型            | 英文标识   | 适用层级         | 说明                                                         |
|-----------------|------------|------------------|--------------------------------------------------------------|
| mock            | mock       | 数据/业务/基础设施| 模拟实现，开发/测试/演示用，数据与 schema 对齐。              |
| local           | local      | 数据/业务/基础设施| 本地实现（如 IndexedDB/SQLite/本地文件/本地 API）。           |
| remote          | remote     | 数据/业务/基础设施| 远程/云端实现（如 Supabase/Firebase/云 API）。                |
| hybrid-adapter  | hybrid     | 数据/业务/基础设施| 同时支持本地与远程，自动切换/同步/冲突解决。                  |

- **命名建议**：统一使用 `XxxServiceAdapter`、`XxxServiceProvider`、`XxxClient` 等后缀。
- **配置建议**：通过 `providerType=mock|local|remote|hybrid` 显式指定。

---

## 三、各服务层适配原则

三种模式（online、offline、hybrid）不仅影响数据服务，还会影响业务服务、基础设施服务、客户端服务等所有服务层的实现和行为：

### 1. 数据服务层（Data Services）
- 推荐根据 `NEXT_PUBLIC_DATA_MODE` 和 `NEXT_PUBLIC_ONLINE_DB_PROVIDER`/`NEXT_PUBLIC_OFFLINE_DB_PROVIDER` 自动选择 adapter。
- mock 阶段用 mock-client，本地开发用 local-adapter/hybrid-adapter，生产用 remote-adapter/hybrid-adapter。
- 支持 schema、mock 数据、同步、迁移等。
- **标准接口方法（与实现 src/core/services/data/types/index.ts 保持一致）：**

```typescript
findById<T>(tableName: string, id: string): Promise<T | null>;
query<T>(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
create<T>(tableName: string, data: T): Promise<T>;
update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
delete(tableName: string, id: string): Promise<void>;
// 批量/事务等扩展方法
createMany<T>(tableName: string, data: T[]): Promise<T[]>;
updateMany<T>(tableName: string, ids: string[], updates: Partial<T>): Promise<number>;
deleteMany(tableName: string, ids: string[]): Promise<number>;
batch(tableName: string, operations: any[]): Promise<void>;
beginTransaction(): Promise<void>;
commitTransaction(): Promise<void>;
rollbackTransaction(): Promise<void>;
// 能力/状态
isInitialized(): boolean;
getStats?(): Promise<any>;
checkHealth?(): Promise<{ healthy: boolean; reason?: string }>;
```
- 所有方法均为泛型，类型安全。
- options、QueryResult<T> 类型详见 data/types。
- update 返回 void；findById 为主接口。

### 2. 业务服务层（Business Services）
- 各业务服务（如用户、消息、支付等）应支持多 provider/adapter 类型，并能根据全局模式变量（如 `NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_ENV_STAGE`、`NEXT_PUBLIC_PLATFORM`）自动切换。
- 业务 hooks 层自动降级、mock、切换 provider。
- 例如：消息服务在 offline 模式下仅本地缓存，hybrid 模式下本地+云端自动同步。

### 3. 基础设施服务层（Infrastructure Services）
- 日志、网络、存储等基础设施服务也应支持 mock/local/remote/hybrid 实现。
- 日志建议 mock 阶段本地输出，生产远程收集。
- 网络服务 hybrid 模式下可支持离线缓存与同步。
- 推荐所有 provider 变量（如 `NEXT_PUBLIC_CACHE_PROVIDER`、`NEXT_PUBLIC_FILE_STORAGE_PROVIDER`、`NEXT_PUBLIC_LOG_STORAGE_PROVIDER` 等）通过配置服务（如 `NEXT_PUBLIC_CONFIG_PROVIDER`）统一管理。

---

## 四、典型环境与模式适配表

| 阶段       | NEXT_PUBLIC_DATA_MODE    | Provider/Adapter 推荐类型           | 说明                              |
|------------|--------------------------|-------------------------------------|-----------------------------------|
| mock       | offline                  | mock-client, mock-adapter           | 零配置自动 mock，开发体验最佳      |
| local      | offline/hybrid           | local-adapter, hybrid-adapter       | 支持本地存储，部分表可混合同步      |
| dev        | hybrid/online            | hybrid-adapter, remote-adapter      | 支持断网、自动降级、数据同步        |
| production | hybrid/online            | hybrid-adapter, remote-adapter      | 云端为主，断网自动降级本地，自动同步 |

---

## 五、环境变量与配置服务统一管理建议

- 所有服务层的 provider、模式、平台等变量均应通过配置服务（如 ConfigService，环境变量如 `NEXT_PUBLIC_CONFIG_PROVIDER`）统一管理，禁止业务代码硬编码或直读 process.env。
- 新增/变更 provider 或模式变量需同步 `.env.example`、`config-keys.ts`、`config-types.ts`、主文档。
- 业务代码应通过类型安全的配置服务接口访问所有运行模式与 provider 变量，便于多端适配和自动补全。

---

## 六、Mock 阶段 Adapter 最佳实践说明（2025 更新）

- 推荐 mock 阶段所有服务优先降级为 mock-adapter（如 MockDatabaseServiceAdapter、MockFileStorageAdapter 等），避免真实依赖。
- 可通过统一的环境变量（如 `NEXT_PUBLIC_ENV_STAGE=mock`）和配置服务自动切换。
- mock-adapter 应与 schema、类型定义保持同步，便于前端开发和自动化测试。
- mock 阶段建议所有持久化均本地存储，便于调试和回归。

---

> 详细环境变量说明见 [environment-variables.md](./environment-variables.md)
