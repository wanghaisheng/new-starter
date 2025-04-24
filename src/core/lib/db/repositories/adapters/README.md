# 仓储适配器模式说明（命名规范强化 2025-04-23）

适配器模式用于对接不同数据源（如 mock、IndexedDB、SQLite、Supabase/Firebase 等），实现多环境灵活切换。

- 强烈禁止使用“local”“cloud”等模糊命名！
- 推荐为每类数据源实现独立适配器，adapter 文件名和类名需直接体现**具体底层实现**：
  - ✅ `UserRepositoryMock` / `user-repository-mock.ts`（内存 mock）
  - ✅ `UserRepositoryIndexedDB` / `user-repository-indexeddb.ts`（Web IndexedDB）
  - ✅ `UserRepositorySQLite` / `user-repository-sqlite.ts`（移动端 SQLite）
  - ✅ `UserRepositorySupabase` / `user-repository-supabase.ts`（Supabase 云端）
  - ✅ `UserRepositoryFirebase` / `user-repository-firebase.ts`（Firebase 云端）
  - ✅ `UserRepositoryHybrid` / `user-repository-hybrid.ts`（混合/同步）
- 业务层通过注册表/工厂获取仓储实例，无需关心底层实现。
- 适配器均实现统一接口 `IBaseRepository<T>`。

示例目录结构：

```
adapters/
  user-repository-mock.ts           # 内存 mock 实现（测试、mock 环境）
  user-repository-indexeddb.ts      # IndexedDB 实现（Web 本地持久化）
  user-repository-sqlite.ts         # SQLite 实现（移动端、本地持久化）
  user-repository-supabase.ts       # Supabase 云端实现
  user-repository-firebase.ts       # Firebase 云端实现
  user-repository-hybrid.ts         # 混合实现（本地+云端同步/切换）
  ...
```

> 命名规范：adapter 名称必须**唯一且无歧义**，直接反映其数据源/实现类型。
> 例如“user-repository-cloud.ts”不推荐，应拆分为 supabase、firebase 等具体实现。

---

## 适配器选择与环境/服务模式的关系（2025-04-23 更新）

适配器（adapter）的选择应结合**环境模式**（ENV_STAGE）、**服务模式**（DATA_MODE）和 providerType，自动优先选择最合适的数据源实现。

### 1. 推荐命名与实现规范
- adapter 文件名/类名必须明确底层数据源类型（如 IndexedDB、SQLite、Supabase/Firebase）。
- 禁止用“local”这类模糊命名。
- 推荐命名示例：
  - `user-repository-indexeddb.ts` / `UserRepositoryIndexedDB`
  - `user-repository-sqlite.ts` / `UserRepositorySQLite`
  - `user-repository-supabase.ts` / `UserRepositorySupabase`
  - `user-repository-firebase.ts` / `UserRepositoryFirebase`
  - `user-repository-mock.ts` / `UserRepositoryMock`

### 2. 不同环境/服务模式下的默认适配器选择

| ENV_STAGE | DATA_MODE       | 默认 adapter/provider         |
|-----------|-----------------|------------------------------|
| mock      | offline-only    | mock（内存/本地 mock）        |
| local     | offline-only    | IndexedDB/SQLite（本地持久化）|
| local     | hybrid          | hybrid（如 IndexedDB+Cloud）  |
| dev       | online-only     | cloud（Supabase/Firebase等）  |
| dev       | hybrid          | hybrid（本地+云端同步）       |
| prod      | online-only     | cloud（Supabase/Firebase等）  |
| prod      | hybrid          | hybrid（本地+云端同步）       |

- mock 阶段优先极简内存 mock adapter，开发体验最佳。
- local 阶段优先 IndexedDB/SQLite adapter，便于本地调试。
- dev/prod 阶段优先 cloud/hybrid adapter，保证数据一致性和云端能力。

### 3. 工厂/注册表自动选择示例

```typescript
import { UserRepositoryMock } from './user-repository-mock';
import { UserRepositoryIndexedDB } from './user-repository-indexeddb';
import { UserRepositoryCloud } from './user-repository-cloud';
import { RepositoryRegistry } from '../registry';

const envStage = process.env.ENV_STAGE;
const dataMode = process.env.DATA_MODE;

let userRepo;
if (envStage === 'mock') {
  userRepo = new UserRepositoryMock();
} else if (envStage === 'local' && dataMode === 'offline-only') {
  userRepo = new UserRepositoryIndexedDB(/* IndexedDBClient */);
} else if (dataMode === 'online-only') {
  userRepo = new UserRepositoryCloud(/* CloudClient */);
} else if (dataMode === 'hybrid') {
  // TODO: 实现 hybrid adapter
  // userRepo = new UserRepositoryHybrid(...);
  userRepo = new UserRepositoryCloud(/* fallback */);
} else {
  userRepo = new UserRepositoryMock();
}
RepositoryRegistry.register('user', userRepo);
```

---

## 适配器与仓储接口一致性要求（2025-04-23 强化）

- 所有适配器（如 Mock/IndexedDB/SQLite/Supabase/Firebase）必须实现统一仓储接口 `IBaseRepository<T>`，方法签名（参数、返回值）必须严格一致。
- 若底层 client 的方法签名与仓储接口不符（如 update/delete 返回 void），适配器实现时必须做类型适配，保证业务层/Service/Hook 获取到的接口和返回值完全一致。
- 禁止直接将 client 的原始方法暴露给业务层。
- 适配器应聚焦于“接口适配”，不应引入业务逻辑。

### 【示例】接口适配代码片段：

```typescript
// 错误：直接暴露 client 返回值
async update(id: string, data: Partial<T>): Promise<T | null> {
  return this.client.update(this.table, id, data); // ❌ 可能返回 void
}

// 正确：适配后返回最新对象
async update(id: string, data: Partial<T>): Promise<T | null> {
  await this.client.update(this.table, id, data);
  return this.findById(id);
}
```

- 任何新增适配器/仓储，必须严格遵循接口签名和分层规范，否则类型推断和业务调用将报错。

---

分层职责与接口规范详见 ../README.md。

---

## SQLite 适配器的特殊说明

- **Capacitor SQLite** 主要用于 PWA/Hybrid App 的本地离线存储（如 `user-repository-sqlite.ts`）。
  - 适用于移动端 App（iOS/Android）和部分支持的 PWA 场景，断网可用。
- **SQLite 也可作为云端/在线数据库**：
  - 例如 [Turso](https://turso.tech/) 等服务，提供基于 SQLite 的云端分布式数据库。
  - 这类 adapter 应单独实现（如 `user-repository-turso.ts` 或 `user-repository-sqlite-cloud.ts`），与本地 SQLite adapter 区分。
- 其他 App 离线存储也可用不同方案（如 Realm、MMKV 等），如需支持请单独实现 adapter 并命名唯一。

> adapter 命名必须**明确区分本地/云端/第三方实现**，如 `user-repository-sqlite.ts`（本地），`user-repository-turso.ts`（Turso 云端），`user-repository-realm.ts`（Realm 本地），避免混淆。

---

## 离线/在线适配器覆盖要求

- 当某个类型（如 User、Message、Match 等）在业务中**有可能支持离线存储**（即 DATA_MODE 包含 offline-only 或 hybrid），**必须实现对应的离线存储 adapter**，例如：
  - Web 平台应有 `user-repository-indexeddb.ts`（IndexedDB 持久化）
  - 移动端应有 `user-repository-sqlite.ts`（SQLite 持久化）
  - mock 环境应有 `user-repository-mock.ts`（内存实现）
- 仅支持云端/在线的类型可只实现云端适配器（如 `user-repository-supabase.ts`、`user-repository-firebase.ts`），但推荐预留 mock adapter 便于测试。
- hybrid 场景应实现 `user-repository-hybrid.ts`，封装本地与云端同步逻辑。

> 适配器实现应覆盖所有实际业务支持的数据源类型，避免遗漏导致环境切换或离线场景下功能不可用。

---

## 泛型化 client 适配说明（2025-04-24 更新）

> 自 2025-04 起，所有数据库 client（如 IndexedDBClient、DrizzleSQLiteClient、CloudflareD1Client 等）已全面泛型化，adapter 层应直接传递类型参数，无需在调用时再手动指定泛型。

### 适配器调用参数示例

```typescript
import { User } from '@/core/lib/db/types/user.types';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { DrizzleSQLiteClient } from '@/core/lib/db/clients/sqlite/drizzle-sqlite-client';
import { UserRepositoryIndexedDB } from './user-repository-indexeddb';
import { UserRepositorySQLite } from './user-repository-sqlite';

// ✅ 推荐：client 实例化时直接带类型参数
const indexedDBClient = new IndexedDBClient<User>();
const userRepoIndexedDB = new UserRepositoryIndexedDB(indexedDBClient);

const sqliteClient = new DrizzleSQLiteClient<User>();
const userRepoSQLite = new UserRepositorySQLite(sqliteClient);

// Cloudflare D1
import { CloudflareD1Client } from '@/core/lib/db/clients/cloudflare/cloudflare-d1-drizzle-client';
const d1Client = new CloudflareD1Client<User>();
// 假设有 UserRepositoryD1
// const userRepoD1 = new UserRepositoryD1(d1Client);
```

- 所有仓储适配器（如 UserRepositorySQLite）构造参数直接传入泛型化后的 client 实例，无需显式传递类型参数。
- 业务调用时自动获得完整类型推断，无需再在方法调用中显式 <User>。
- 适配器基类（如 BaseSQLiteRepository、BaseIndexedDBRepository）也已同步泛型化。

---

> 详细环境与服务模式说明见 docs/guides/environment-modes.md、docs/guides/service-modes.md。
