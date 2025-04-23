# DataInitializerService 使用说明

本服务用于多环境下数据库表结构和初始数据的自动导入与管理，支持内存（memory）、JSON 文件、SQL 文件等多种数据源，适配 mock、开发、本地测试、生产等不同阶段。

---

## 一、不同开发阶段的数据初始化策略

| 阶段         | 推荐数据库类型     | 数据来源         | 说明                         |
|--------------|-------------------|------------------|------------------------------|
| mock         | memory/json/sqlite| memory/mock-data | 纯前端/Node mock，快速开发   |
| 本地测试     | sqlite            | sql/json         | 保证与生产结构一致，易于重置 |
| 生产/预发    | sqlite/remote     | sql              | 严格按 SQL 脚本导入           |

- **memory**：直接导入 `src/core/lib/db/data` 下的 mock 数据。
- **json**：从指定 json 文件批量导入（如 `mock-data.json`）。
- **sql**：批量执行 sql 脚本，自动建表和导入数据（如 `mock-sql/*.sql`）。

---

## 二、如何使用 DataInitializerService 初始化数据

### 1. 基本用法

```typescript
import { DataInitializerService } from './data-initializer.service';

const initializer = new DataInitializerService({
  env: process.env.NODE_ENV, // 'mock' | 'local' | 'prod'
  dbConfig: { ... },         // 数据库 client 配置
  // type: 'memory' | 'json' | 'sql'，可省略自动识别
  // jsonFilePath / sqlDir 可选
});
await initializer.initialize();
const dbClient = initializer.getClient();
```

### 2. 环境变量与自动切换
- 支持通过 `NODE_ENV`、`MOCK_DB_IMPORT_MODE` 等变量自动切换数据导入方式。
- 业务 service 层无需关心数据来源，全部通过 dbClient 统一访问。

---

## 三、如何管理要导入的数据库表和数据

### 1. mock 数据管理
- 在 `src/core/lib/db/data/` 下维护各表 mock 数据文件（如 `user.mock.ts`、`config.mock.ts`）。
- 每个 mock 文件导出一个数组或对象，字段与表结构保持一致。
- 可通过 `src/core/lib/db/data/index.ts` 聚合所有 mock 数据。

### 2. JSON 数据管理
- 推荐生成统一的 `mock-data.json`，结构为 `{ 表名: 数据数组 }`。
- 可通过脚本自动从 mock ts 文件导出为 json。

### 3. SQL 数据管理
- 在 `mock-sql/` 或 `sql/` 目录下维护建表和数据导入脚本（如 `user.sql`、`config.sql`）。
- 脚本需包含建表和插入数据语句，保证与生产环境一致。
- DataInitializerService 支持自动遍历并执行所有 sql 文件。

---

> ⚠️ 本目录所有服务设计、接口、初始化流程等规范请统一参考 [../../service-design-guidelines.md](../../service-design-guidelines.md)。如有特殊补充仅在此说明，其余请勿重复维护。

---

## 四、最佳实践

- 所有表结构和 mock 数据应与生产环境 schema 保持同步，避免测试/生产不一致。
- 推荐在 CI/CD 或开发启动脚本中自动初始化数据，保证环境一致性。
- 扩展新数据源/适配器时，仅需实现 `IDataInitializerAdapter` 并注册到工厂/注册表。
- 业务 hooks 与 service 层全部通过注册表获取实例，禁止直接 new。

---

## 五、常见问题

- **如何新增 mock 表/数据？**
  - 在 `db/data/` 下新增 mock 文件并在 `index.ts` 聚合即可。
- **如何切换数据导入方式？**
  - 通过构造参数 `type` 或设置环境变量 `MOCK_DB_IMPORT_MODE`。
- **如何保证表结构和数据一致？**
  - 统一维护 schema 和数据源，定期自动校验和导出。

---

## 六、三种模式下的数据初始化细节与最佳实践

### 1. 纯在线模式（Online Only）
- **目标数据库**：远程云端数据库（如 Supabase、Firebase、API 服务端）
- **数据初始化来源**：通常无需本地导入，所有数据均由云端接口返回。
- **初始化流程**：
  - 首次启动直接拉取远程数据。
  - 若有本地缓存，仅做 session 级缓存，无持久化。
- **适用场景**：强一致性、数据安全要求高、网络稳定。

### 2. 纯离线模式（Offline Only）
- **目标数据库**：本地 IndexedDB（Web）、SQLite（移动端/桌面端）
- **数据初始化来源**：mock-data.ts、mock-data.json、mock-sql/*.sql 或随包发布的本地数据文件。
- **初始化流程**：
  - 启动时检测本地数据库是否已初始化（如有 initFlag/meta 表）。
  - 若未初始化，自动导入本地 mock/json/sql 数据。
  - 支持重置本地数据库，便于开发调试。
- **适用场景**：弱网、断网、隐私、演示、开发测试。

### 3. 混合模式（Hybrid/Sync）
- **目标数据库**：本地 IndexedDB/SQLite + 云端数据库
- **数据初始化来源**：本地 mock/json/sql + 云端拉取/同步
- **初始化流程**：
  - 首次启动检测本地数据库是否已初始化。
  - 若未初始化，先导入本地 mock/json/sql 数据。
  - 初始化后自动触发与云端的同步（如 syncManager.syncWithCloud()）。
  - 支持本地优先、云端优先、手动同步等策略。
  - 需处理同步冲突和数据合并。
- **适用场景**：既要离线可用，又需与云端数据保持同步。

---

## 七、DataInitializerService 在三种模式下的用法示例

```typescript
import { DataInitializerService } from './data-initializer.service';

const initializer = new DataInitializerService({
  env: 'mock', // mock | local | prod
  dbConfig: { /* ... */ },
  // type: 'memory' | 'json' | 'sql'，可省略自动识别
  // jsonFilePath / sqlDir 可选
});
await initializer.initialize();
const dbClient = initializer.getClient();
```

- 纯离线/混合场景下建议在本地数据库未初始化时自动调用 initialize。
- 可结合本地 meta/version 表做初始化检测与升级迁移。
- 混合模式下初始化后建议自动触发云端同步。

---

## 八、表结构与数据管理建议

- **mock 数据**：统一在 `src/core/lib/db/data/` 下维护，结构与生产 schema 对齐。
- **json/sql 数据**：推荐用脚本从 mock 源自动生成，保证一致性。
- **本地数据库升级**：建议每次 schema 变更时增加版本号和迁移脚本。
- **同步管理**：混合模式下需有同步标记、冲突处理和数据合并策略。

---

## 九、常见问题与典型场景

- 如何在不同模式下切换数据初始化方式？
  - 通过 DataInitializerService 的 type/env 参数或环境变量自动切换。
- 如何保证本地、云端数据一致？
  - 混合模式下需定期同步，并处理冲突。
- 如何新增 mock 数据表/数据？
  - 在 db/data/ 下增加 mock 文件并聚合导出，或生成 json/sql 文件。

---

## 十、服务端与客户端离线数据初始化的区别与实践

### 1. 离线存储本质说明
- 离线数据库（如 IndexedDB、SQLite）实际存储在客户端（浏览器、App、桌面端）本地。
- 服务端（Node.js/mock 环境）**无法直接操作真实客户端用户的本地数据库**。
- 也就是说，服务端的 DataInitializerService 仅适用于本地 mock 测试、Node 环境下的端到端测试，**无法直接为真实用户的客户端离线数据库预置数据**。

### 2. 客户端离线数据初始化的正确做法
- 客户端首次启动时，前端代码需检测本地数据库是否为空，若为空则自动导入 mock/json/sql 数据。
- 初始化数据可通过以下方式获取：
  - 随前端包发布的 mock-data.json、mock-sql.sql 等静态资源
  - 首次联网时从服务端拉取初始化数据包，由客户端导入本地数据库
- 这部分初始化逻辑需在客户端（JS/TS/React/Capacitor/移动端）实现，不能依赖服务端直接写入。

### 3. 推荐架构与实现建议
- 在前端项目中实现 `ClientDataInitializerService`，用于本地数据库初始化和导入。
- 初始化数据建议与服务端 mock 数据保持一致，可用脚本自动生成。
- 前端初始化流程示例：

```typescript
async function initializeClientDbIfNeeded() {
  const hasInitFlag = await dbClient.getMeta('initFlag');
  if (!hasInitFlag) {
    // 1. 读取 mock-data.json 或 sql 文件
    // 2. 批量导入本地数据库
    await dbClient.setMeta('initFlag', true);
  }
}
```

### 4. 文档与团队协作建议
- 文档需明确区分“服务端初始化”（本地 mock/Node 环境）与“客户端初始化”（浏览器/移动端）两种场景。
- 客户端离线初始化相关实现、最佳实践、代码模板建议单独沉淀在 `docs/guides/client-offline-init.md`。
- 所有 mock 数据、初始化数据包建议统一维护，便于前后端一致。

---

更多多端多场景数据初始化与同步管理细节，请参考 [docs/guides/data-initialization-modes.md](/docs/guides/data-initialization-modes.md)。

如需更多高级用法和自动化脚本示例，请参考项目文档或联系架构负责人。

---

## 四、架构集成与高级用法

### 1. 与数据服务/仓储层的解耦协作
- DataInitializerService 不直接操作底层数据库 client，也不关心具体环境（mock/local/dev/prod）或 adapter/provider 的选择。
- 初始化服务通过数据服务工厂/注册表获取已选好的数据服务实例（如 IndexedDB/SQLite/Supabase/Mock 等），由数据服务屏蔽环境和底层实现细节。
- 所有数据写入、建表、批量导入均通过仓储层（Repository）完成，保证类型安全、校验和业务一致性。

#### 典型调用链示例
```typescript
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { UserRepository } from '@/core/lib/db/repositories/user.repository';
import { DataInitializerService } from './data-initializer.service';

const dataService = DataServiceRegistry.getInstance(); // 已按环境自动选择 adapter
const userRepository = new UserRepository(dataService);

await DataInitializerService.initialize({
  repositories: { userRepository },
  mockData: { users: mockUsers },
  // 其它参数如 env、mode ...
});
// DataInitializerService 内部通过 userRepository.bulkInsert(mockUsers) 完成写入
```

### 2. 支持多环境/多模式/多数据源的初始化策略
- 初始化服务自动通过配置服务（configService）获取当前环境模式（如 ENV_STAGE、DATA_MODE、ONLINE_DB、OFFLINE_DB），无需手动指定。
- 支持 memory、json、sql、云端拉取等多种初始化方式，自动适配当前运行环境。
- 可配置“首次初始化、重置数据、导入导出、数据迁移”等高级能力。
- 详细策略参见 [环境模式](../../../../docs/guides/environment-modes.md)、[服务模式](../../../../docs/guides/service-modes.md)、[数据初始化模式](../../../../docs/guides/data-initialization-modes.md)。

### 3. 设计原则与最佳实践
- 初始化服务与数据服务、仓储层完全解耦，便于测试、扩展和维护。
- 所有 mock 数据、schema、初始化脚本集中管理，便于多端/多环境一致性。
- 推荐所有业务数据初始化均通过仓储层批量写入，避免直连数据库 client。
- 初始化流程应具备幂等性和可重入性。

### 4. FAQ
- **Q: DataInitializerService 如何屏蔽环境和底层数据库选择？**
  - A: 通过数据服务工厂/注册表获取实例，adapter/provider 选择全部由数据服务层自动完成。
- **Q: 如何保证 mock、本地、云端等多环境下初始化一致？**
  - A: 初始化服务统一走仓储层和数据服务，所有数据源和表结构集中管理，流程自动适配。
- **Q: 可以只初始化部分表/数据吗？**
  - A: 支持传入部分 mock/json/sql 数据，按需初始化。

---
