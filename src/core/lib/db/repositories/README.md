# 仓储层设计说明（Repository Layer Documentation）

本说明文档统一规范本项目仓储（Repository）层的设计原则、结构、接口、适配器模式及最佳实践，适用于所有数据仓储实现。

---

## 一、设计理念与目标

- **解耦**：仓储层仅依赖统一接口（`IDataService`/`IBaseRepository`），禁止直接依赖底层数据库 client。
- **多环境适配**：支持 mock、本地、云端等 provider 灵活切换，满足开发、测试、生产多场景。
- **依赖注入/插件化**：所有仓储实例通过注册表/工厂获取，禁止直接 new，实现插件化、mock 自动降级、A/B 测试等。
- **接口/状态统一**：所有仓储方法返回值统一，包含 `loading`、`error`、`empty` 等状态，异常细分类型，便于 hooks/页面一致处理。
- **类型安全**：所有接口、类型、异常、状态定义集中在 `types/` 目录。
- **可扩展性**：支持动态注册/替换实现，便于业务扩展、定制、灰度发布等。

---

## 二、目录结构与职责划分

```
src/core/lib/db/repositories/
├── base-repository.ts                # 通用抽象基类
├── mock-repository.ts                # 通用 mock 基类
├── registry/                         # 注册表子目录（注册、获取、动态切换仓储实例）
│   └── repository-registry.ts
├── factory/                          # 工厂方法子目录（标准化创建仓储实例）
│   └── repository-factory.ts
├── adapters/                         # 适配器子目录（多数据源实现）
│   ├── user-repository-mock.ts
│   ├── user-repository-indexeddb.ts
│   ├── user-repository-sqlite.ts
│   ├── user-repository-supabase.ts
│   ├── user-repository-firebase.ts
│   ├── user-repository-hybrid.ts
│   └── README.md
├── user-repository.ts                # 具体实体仓储（真实实现）
├── user-mock-repository.ts           # 具体实体 mock 仓储
└── ...（其他实体/Mock/扩展）
```

- **registry/**：集中管理所有仓储注册与获取逻辑，暴露注册表 API。
- **factory/**：封装所有仓储工厂方法，便于扩展和复用。
- **adapters/**：每类数据源实现独立适配器，文件/类命名需直接体现底层实现（如 mock、indexeddb、sqlite、supabase、firebase、hybrid 等）。

---

## 三、适配器模式与实现规范

适配器用于对接不同数据源（如 mock、IndexedDB、SQLite、Supabase/Firebase 等），实现多环境灵活切换。

- 强烈禁止使用“local”“cloud”等模糊命名！
- 每类数据源实现独立适配器，adapter 文件名和类名需直接体现具体底层实现：
  - ✅ `UserRepositoryMock` / `user-repository-mock.ts`（内存 mock）
  - ✅ `UserRepositoryIndexedDB` / `user-repository-indexeddb.ts`（Web IndexedDB）
  - ✅ `UserRepositorySQLite` / `user-repository-sqlite.ts`（移动端 SQLite）
  - ✅ `UserRepositorySupabase` / `user-repository-supabase.ts`（Supabase 云端）
  - ✅ `UserRepositoryFirebase` / `user-repository-firebase.ts`（Firebase 云端）
  - ✅ `UserRepositoryHybrid` / `user-repository-hybrid.ts`（混合/同步）
- 适配器均实现统一接口 `IBaseRepository<T>`，保证业务解耦和类型安全。
- 业务层通过注册表/工厂获取仓储实例，无需关心底层实现。

**适配器目录结构示例：**
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

**实现规范：**
- 每个适配器类应继承自 `BaseRepository<T>` 或实现 `IBaseRepository<T>`。
- 构造函数注入具体数据源 client/driver。
- 仅实现当前数据源相关逻辑，跨源逻辑由业务/服务层聚合。
- 适配器可通过注册表/工厂动态注册与切换。

**示例：**
```typescript
// user-repository-indexeddb.ts
import { BaseRepository } from '../base-repository';
import { User } from '../../types';
import { IndexedDBClient } from '../../clients/indexeddb';

export class UserRepositoryIndexedDB extends BaseRepository<User> {
  constructor(client: IndexedDBClient) {
    super(client, 'users');
  }
  // 可扩展 IndexedDB 特有方法
}
```

更多适配器命名、实现细节请参见 adapters/README.md。

---

## 四、环境模式与服务模式适配

本项目的仓储层需严格遵循环境模式（Environment Modes）与服务层运行模式（Service Modes）规范，实现多环境、多模式下的自动适配和降级。

### 1. 环境模式（ENV_STAGE）
- **mock**：单元测试、接口 mock、无后端依赖，全部服务采用 mock provider，数据本地存储。
- **local**：本地开发、调试，本地数据库、本地 API，可选 hybrid provider。
- **dev**：团队联调、接口测试，连接云端测试数据库、API，允许部分 mock。
- **prod**：上线、正式发布，连接生产数据库、API，所有功能真实可用。

环境变量：
- `ENV_STAGE=mock|local|dev|prod`
- `.env.mock`、`.env.local`、`.env.dev`、`.env.prod` 分环境配置

### 2. 服务层运行模式（DATA_MODE）
- **online-only**：仅依赖云端/远程服务，适用于生产/强一致性/云优先场景。
- **offline-only**：仅依赖本地存储/数据库，适用于 mock/弱网/本地开发/隐私场景。
- **hybrid**：本地与云端并存，断网自动降级本地，联网自动同步。

环境变量：
- `DATA_MODE=online-only|offline-only|hybrid`

### 3. provider/adapter 类型与命名规范
- providerType=mock|local|remote|hybrid，强制显式指定。
- 文件/类命名需直接体现底层实现（如 mock、indexeddb、sqlite、supabase、firebase、hybrid）。
- 统一使用 `XxxRepositoryMock`、`XxxRepositoryIndexedDB`、`XxxRepositorySQLite`、`XxxRepositorySupabase` 等命名。

### 4. 仓储层适配原则
- 根据 `ENV_STAGE` 和 `DATA_MODE` 自动选择合适的仓储/适配器。
- mock 阶段仅使用极简内存 mock 适配器，local 阶段可用本地/混合适配器，dev/prod 阶段优先 remote/hybrid。
- 业务层、hooks 层、服务层统一通过注册表/工厂获取仓储实例，无需关心底层实现。
- 支持运行时切换、自动降级、A/B 测试。

**典型适配表：**
| ENV_STAGE | DATA_MODE      | 推荐 provider/adapter         |
|-----------|---------------|------------------------------|
| mock      | offline-only  | MemoryMockRepositoryAdapter   |
| local     | offline-only  | IndexedDB/SQLiteRepository    |
| local     | hybrid        | HybridRepositoryAdapter       |
| dev       | online-only   | Supabase/FirebaseRepository   |
| dev       | hybrid        | HybridRepositoryAdapter       |
| prod      | online-only   | Supabase/FirebaseRepository   |
| prod      | hybrid        | HybridRepositoryAdapter       |

---

## 五、Mock/多环境自动降级

- 支持开发、测试、离线等场景下自动切换 mock 实现。
- mock 数据、初始化脚本集中管理，便于测试可控、复现。
- hooks 层自动降级到 mock 仓储（如根据 `process.env.NODE_ENV`、`ENV_STAGE`、`DATA_MODE` 或测试标识）。

---

## 六、仓储接口与方法命名统一规范

仓储层是数据访问与业务逻辑之间的桥梁：
- **向下**对接数据库客户端（如 IndexedDB、SQLite、Supabase 等），所有底层操作通过统一的 client/driver 实现，禁止仓储层直接操作原生 API。
- **向上**为业务服务层（Service）、业务 hooks 统一提供标准化接口，所有业务代码、hooks、服务只能通过仓储接口访问数据，禁止跨层直连。

### 1. 接口与方法命名统一
- 所有仓储、数据库客户端、业务服务接口名称、方法名称尽量保持一致，降低认知成本。
- 推荐接口和方法命名：
  - `findById(id: string): Promise<T | null>`
  - `findAll(): Promise<T[]>`
  - `create(data: Partial<T>): Promise<T>`
  - `update(id: string, data: Partial<T>): Promise<T>`
  - `delete(id: string): Promise<void>`
  - `findWithPagination(...)`、`findWithComplexConditions(...)`、`markMultipleAsRead(...)` 等扩展方法
- 返回值结构建议：
  - 统一返回 Promise，必要时封装为 `{ data, loading, error, empty }` 结构，便于 hooks/页面一致处理。
  - 错误细分类型，便于业务层精准捕获和用户提示。

### 2. 统一接口/类型/异常定义
- 所有接口、类型、异常、状态定义集中在 `types/` 目录，禁止各处重复定义。
- hooks、服务层、页面层全部通过统一接口编程，避免认知分歧。

### 3. 典型调用链示意

```
页面/组件
   ↓
业务 hooks（useXxx）
   ↓
业务服务（XxxService）
   ↓
仓储（XxxRepository）
   ↓
数据库客户端（XxxClient/Adapter）
```

### 4. 仓储层的角色与接口规范

#### 1. 仓储层的定位
- 仓储（Repository）是业务与底层数据源之间的桥梁，负责实体级数据操作和统一接口暴露。
- 其职责是：为业务层（Service/Hook）屏蔽不同数据源的实现差异，提供一致、易用的 CRUD 接口。
- 仓储不直接操作数据库/网络，而是通过 client/adapter 适配器与具体数据源交互。

#### 2. 与 Client/Service 层的区别
- **Client 层**：直接对接底层数据库/存储 API，方法签名紧贴原生实现（如 IndexedDBClient、SupabaseClient 等）。返回值通常为 void、原始对象或原生 Promise。
- **Repository 层**：面向实体和业务，方法签名和返回值需统一、友好。例如：
  - `update` 必须返回最新对象（T | null），不能直接返回 void。
  - `delete` 必须返回 boolean，表示是否真正删除。
  - `findById`、`findAll` 等必须返回业务可直接用的数据。
- **Service 层**：聚合多个仓储和业务逻辑，侧重用例和流程，返回值可再做包装。

#### 3. 仓储接口方法与返回值要求
- 所有仓储适配器（如 IndexedDB/SQLite/Mock/Firebase/Supabase）必须实现统一接口 `IBaseRepository<T>`：

```typescript
interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  // ...可扩展
}
```
- **强制要求**：
  - 方法签名（参数、返回值）必须与接口完全一致。
  - 若底层 client 实现与接口不符（如 update/delete 返回 void），仓储适配器必须做类型适配（如 update 后再 findById，delete 后判断是否存在）。
  - 禁止直接暴露 client 的原始接口给业务层。
- 适配器命名、文件结构、工厂注册规范详见 adapters/README.md。

#### 4. 典型分层调用关系

```
页面/Hook
   ↓
Service 层（业务聚合，可选）
   ↓
Repository 层（统一接口，业务友好）
   ↓
Client/Adapter 层（对接具体数据源）
   ↓
底层存储/网络
```

#### 5. 常见错误与防范
- 不同数据源的 CRUD 方法签名不一致时，务必在仓储层做适配！
- 仓储适配器只需关注接口一致性，具体实现可灵活适配底层。
- 任何新增适配器/仓储，必须严格遵循接口签名和分层规范，否则类型推断和业务调用将报错。

---

更多适配器命名、注册、工厂模式细节见 adapters/README.md。

---

## 七、最佳实践与经验教训

- 始终通过基类方法访问数据，避免直接操作底层 client。
- 所有数据库操作统一错误处理，封装为标准异常类型。
- 批量/事务场景优先使用基类的事务方法，保证数据一致性。
- hooks/service 层统一通过注册表/工厂获取仓储实例，禁止直接 new。
- 类型、接口、状态、异常全部集中在 types/ 目录，保证一致性。

---

## 八、日志服务与配置服务集成规范

- 所有仓储实现、适配器、数据库客户端应**优先通过日志服务**（如 `LoggerService`）记录关键操作、异常、慢查询、批量操作等，禁止直接使用 `console.log`。
- 日志服务应支持多环境适配（本地输出、远程收集、mock/测试静默等），具体集成方式和最佳实践详见 [`src/core/services/infrastructure/logger/`](../../services/infrastructure/logger/) 及相关文档。
- 配置服务（如 `ConfigService`）用于统一管理仓储层、数据库、适配器、环境变量等配置，禁止硬编码，所有环境敏感配置应通过配置服务获取。
- 配置服务应支持 `.env` 文件、环境变量、远程配置等多种来源，详见 [`src/core/services/infrastructure/config/README.md`](../../services/infrastructure/config/README.md)。
- 推荐在仓储初始化、适配器切换、mock/环境降级、异常捕获等关键节点自动记录日志和读取配置。

---

## 九、仓储注册与工厂的配置感知机制

- 仓储的注册表（Registry）与工厂（Factory）在实例化仓储时，**必须通过配置服务（ConfigService）感知和决定底层数据库实现类型**。
- 配置服务负责读取 `.env` 文件、环境变量或远程配置，自动识别当前环境（如 mock、local、dev、prod）和数据库类型（如 mock、indexeddb、sqlite、supabase、firebase、hybrid）。
- 工厂方法根据配置服务返回的 provider/database 类型，动态选择并实例化对应的仓储适配器（如 UserRepositoryMock、UserRepositoryIndexedDB、UserRepositorySupabase 等）。
- 这样可实现多环境自动切换、mock/本地/云端/混合适配、A/B 测试等高级能力，业务层无需关心底层数据库实现。
- 推荐所有注册表/工厂方法内部都统一依赖配置服务，禁止硬编码 provider/adapter 类型。

**示例流程：**
```typescript
import { ConfigService } from '@/core/services/infrastructure/config/config-service';
import { getRepository } from '../registry/repository-registry';

const providerType = ConfigService.get('DB_PROVIDER_TYPE'); // 如 'mock' | 'indexeddb' | 'supabase' ...
const userRepo = getRepository('user', providerType, ...args);
```

如需配置感知工厂/注册表的最佳实践模板或自动注册脚本，请参考 config 相关目录或联系架构负责人。

---

## ⚠️ 常见问题与最佳实践：Repository 查询结果类型一致性

### 背景
在多数据库实现（如 Kysely/SQLite、Mock、IndexedDB 等）下，Repository 层的查询方法（如 `findByEmail`）常因底层 client/query 返回结构不一致导致类型断裂、运行时分支混乱，甚至出现查到数据但返回 null 的问题。

### 典型问题
- 某些 client.query 返回 `{ items: T[] }`，某些直接返回 `T[]`，导致 Repository 代码需兼容多种返回结构。
- 这会引发类型判断分支、测试用例难以通过、调试困难等问题。

### 最佳实践与修复方案
1. **强制所有 client/query 方法统一返回 `{ items: T[] }` 结构，无论查到什么都不直接返回数组。**
2. **Repository 查询方法（如 `findByEmail`）只判断 `results.items`，无需兼容数组分支。**
3. **如有历史代码或第三方库返回数组，建议在 Repository 内部做一次结构转换。**
4. **测试用例中如遇“expected null to be truthy”且明明有数据，优先检查 query 返回结构和 repository 判断逻辑。**

### 参考修复代码
```typescript
// client.query 统一返回
return { items: Array.isArray(rows) ? rows : (rows ? [rows] : []) };

// repository 查询方法
async findByEmail(email: string): Promise<User | null> {
  const results = await this.client.query(this.table, { where: { email } });
  if (results && Array.isArray(results.items) && results.items.length > 0) {
    return results.items[0];
  }
  return null;
}
```

### 结论
- 类型一致性是 Repository 层健壮性和可维护性的基础，建议所有新实现/重构都采用统一返回结构。
- 如遇类型相关疑难杂症，优先排查 client/query 与 repository 的契约。

---
