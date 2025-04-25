# 环境变量与配置项一览

本项目所有环境变量已分组标准化，统一采用 `NEXT_PUBLIC_` 前缀（前端可见），便于前后端一致、自动补全和类型安全。下表分为数据库/ORM、认证服务、云存储、推送服务、通用配置五大类。

---

## 存储相关环境变量配置

本节统一归纳所有与“存储”相关的环境变量，涵盖数据库、ORM、缓存、文件、日志、队列等多种存储场景，便于多端/多模式项目的灵活配置与维护。

### 1. 数据库与 ORM 配置

| 变量名                         | 典型值                       | 说明                                      |
|--------------------------------|------------------------------|-------------------------------------------|
| NEXT_PUBLIC_ONLINE_DB_PROVIDER | supabase/firebase/自定义     | 远程/云端数据库类型                      |
| NEXT_PUBLIC_OFFLINE_DB_PROVIDER| sqlite/indexeddb/自定义      | 本地/离线数据库类型                      |
| NEXT_PUBLIC_DB_ORM             | drizzle/typeorm/none         | ORM/数据库访问层类型，none 表示不用 ORM   |

### 2. 缓存配置

| 变量名                        | 典型值                  | 说明                                      |
|-------------------------------|-------------------------|-------------------------------------------|
| NEXT_PUBLIC_CACHE_PROVIDER    | redis/localstorage      | 缓存实现类型                              |
| NEXT_PUBLIC_TEMP_CACHE_PROVIDER | memory/redis/localstorage | 临时/会话型缓存实现类型               |

### 3. 文件存储配置

| 变量名                         | 典型值                  | 说明                                      |
|-------------------------------|-------------------------|-------------------------------------------|
| NEXT_PUBLIC_FILE_STORAGE_PROVIDER | s3/oss/gcs/local      | 文件/对象存储实现类型                     |

### 4. 日志与队列配置

| 变量名                         | 典型值                  | 说明                                      |
|-------------------------------|-------------------------|-------------------------------------------|
| NEXT_PUBLIC_LOG_STORAGE_PROVIDER | sentry/elk/console     | 日志服务实现类型                          |
| NEXT_PUBLIC_QUEUE_PROVIDER    | rabbitmq/kafka/redis    | 队列/消息中间件实现类型                   |

### 5. 其他可扩展存储配置

| 变量名                         | 典型值                  | 说明                                      |
|-------------------------------|-------------------------|-------------------------------------------|
| NEXT_PUBLIC_SEARCH_PROVIDER   | elasticsearch/algolia   | 搜索/索引存储实现类型                     |
| NEXT_PUBLIC_CONFIG_PROVIDER   | consul/etcd/ssm/localfile | 配置中心/参数存储实现类型              |
| NEXT_PUBLIC_ARCHIVE_PROVIDER  | oss/s3/hdfs/glacier     | 归档/冷数据存储实现类型                   |
| NEXT_PUBLIC_METADATA_PROVIDER | mysql/sqlite/jsonfile   | 元数据/schema 存储实现类型                |
| NEXT_PUBLIC_SECRET_PROVIDER   | vault/aws-secrets-manager/env | 密钥/令牌存储实现类型                 |

---

> **说明：**
> - 每个存储场景建议单独配置 provider 变量，避免混用和歧义。
> - 业务代码应分层获取 provider 类型，结合 `DATA_MODE` 等变量灵活切换。
> - 新增/变更 provider 变量需同步 `.env.example`、`config-keys.ts`、`config-types.ts` 和本说明文档。
> - 具体 provider 取值可根据实际业务和技术选型扩展。

---

## 认证/服务类型配置

| 变量名                          | 典型值                 | 说明                       |
|----------------------------------|------------------------|----------------------------|
| NEXT_PUBLIC_AUTH_TYPE            | firebase/mock          | 认证方式（前端可见）       |
| NEXT_PUBLIC_AUTH_SERVICE_TYPE    | firebase/betterauth    | 认证服务类型               |
| NEXT_PUBLIC_USER_SERVICE_TYPE    | mock                   | 用户服务类型               |
| NEXT_PUBLIC_MESSAGE_SERVICE_TYPE | mock                   | 消息服务类型               |
| NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE | mock              | 通知服务类型               |
| NEXT_PUBLIC_PAYMENT_SERVICE_TYPE | revenuecat/mock        | 支付服务类型               |
| NEXT_PUBLIC_QUIZ_SERVICE_TYPE    | mock                   | 测验服务类型               |
| NEXT_PUBLIC_BETTER_AUTH_API_URL  | https://auth.xxx.com   | BetterAuth API 地址        |
| BETTER_AUTH_SECRET               | ...                    | BetterAuth 服务端密钥      |

---

## 云存储（Firebase等）配置

| 变量名                                  | 典型值        | 说明                   |
|------------------------------------------|---------------|------------------------|
| NEXT_PUBLIC_FIREBASE_API_KEY             | ...           | Firebase 公钥          |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         | ...           | Firebase Auth 域名     |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID          | ...           | Firebase 项目ID        |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      | ...           | Firebase 存储桶        |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | ...           | Firebase 推送ID        |
| NEXT_PUBLIC_FIREBASE_APP_ID              | ...           | Firebase APP_ID        |

---

## 推送服务配置（如有可补充）

| 变量名                | 典型值 | 说明                |
|-----------------------|--------|---------------------|
| NEXT_PUBLIC_PUSH_APP_KEY | ...  | 推送服务AppKey      |

---

## 通用/辅助配置

| 变量名                             | 典型值                          | 说明                       |
|-------------------------------------|---------------------------------|----------------------------|
| NEXT_PUBLIC_NODE_ENV                | development/production/test      | 运行环境                   |
| NEXT_PUBLIC_ENV_STAGE               | mock/local/dev/prod              | 当前业务/部署环境           |
| NEXT_PUBLIC_DATA_MODE               | online-only/offline-only/hybrid  | 服务层运行模式             |
| NEXT_PUBLIC_API_BASE_URL            | http://localhost:3000            | 后端 API 基础地址          |
| NEXT_PUBLIC_API_ENV                 | local/dev/prod                   | API 运行环境               |
| NEXT_PUBLIC_PLATFORM                | web/mobile                       | 平台类型                   |
| NEXT_PUBLIC_LOG_LEVEL               | debug/info/warn/error            | 日志输出等级               |
| NEXT_PUBLIC_PROVIDER_TYPE           | mock/local/remote/hybrid         | 服务/适配器类型            |
| NEXT_PUBLIC_FEATURE_FLAG            | ...                              | 功能开关                   |
| NEXT_PUBLIC_BRAND                   | ...                              | 品牌标识                   |
| NEXT_PUBLIC_SYNC_AUTO_ON_CONNECT    | true/false                       | 自动同步开关               |
| NEXT_PUBLIC_SYNC_INTERVAL           | 60000（单位 ms）                 | 同步间隔                   |
| NEXT_PUBLIC_SYNC_ENABLED            | true/false                       | 是否启用同步               |
| NEXT_PUBLIC_SYNC_STRATEGY           | periodic/triggered               | 同步策略                   |
| NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION| server-wins/client-wins/merge    | 冲突解决策略               |
| NEXT_PUBLIC_ENABLE_OFFLINE          | true/false                       | 启用离线功能               |
| NEXT_PUBLIC_ENABLE_HYBRID           | true/false                       | 启用混合模式               |
| NEXT_PUBLIC_CONFLICT_RESOLUTION     | server-wins/client-wins/merge    | 业务冲突解决策略           |
| NEXT_PUBLIC_LOAD_TEST_DATA          | true/false                       | 加载测试数据               |
| NEXT_PUBLIC_TEST_DATA_SOURCE        | example/dating                   | 测试数据类型               |
| NEXT_PUBLIC_QUIZ_API_BASE_URL       | ...                              | 测验 API 地址              |
| NEXT_PUBLIC_QUIZ_AI_BASE_URL        | ...                              | AI 测验 API 地址           |
| NEXT_PUBLIC_APP_VERSION             | 1.0.0                            | 应用版本号                 |
| NEXT_PUBLIC_BUILD_NUMBER            | 1                                | 构建号                     |
| NEXT_PUBLIC_USE_MOCK_NETWORK        | true/false                       | 是否使用 mock 网络         |
| NEXT_PUBLIC_USE_MOCK_DB             | true/false                       | 是否使用 mock 数据库       |
| LOGGER_PROVIDER                     | winston/mock/default             | 日志适配器类型             |
| LOG_LEVEL                           | INFO/DEBUG                       | 服务器日志等级             |
| EMAIL_PROVIDER                      | smtp/xxx                         | 邮件服务提供商             |
| R2_REGION/R2_ENDPOINT/...           | ...                              | 对象存储相关               |
| GITHUB_TOKEN/GITHUB_REPO/...        | ...                              | 第三方集成                 |
| TG_BOT_TOKEN/TG_CHAT_ID             | ...                              | Telegram 机器人            |

---

> 所有变量已在 `src/core/services/infrastructure/config/config-keys.ts` 集中声明，建议所有业务代码通过 `configService.get(CONFIG_KEYS.变量名)` 访问，禁止硬编码。

如需新增服务或变量，请同步更新本表和 config-keys.ts！

---

## NEXT_PUBLIC_DATA_MODE 及相关变量详解

`NEXT_PUBLIC_DATA_MODE` 是控制应用数据访问模式的核心环境变量，决定了前端/服务层如何与本地和远程数据源交互。它与多端数据同步、离线能力、业务场景适配密切相关。理解该变量及其相关变量的协同作用，有助于开发者设计出既能离线运行、又能高效同步的现代应用。

### 1. 变量定义与典型取值

- **NEXT_PUBLIC_DATA_MODE**
  - 取值：`online-only`、`offline-only`、`hybrid`
  - 作用：决定应用的数据访问模式
    - `online-only`：仅使用远程 API/数据库，适合纯云端应用
    - `offline-only`：仅用本地数据库（如 IndexedDB/SQLite），适合弱网/离线场景
    - `hybrid`：本地数据库为主，支持与远程服务双向同步，兼顾离线体验与数据一致性

### 2. 相关环境变量与协同关系

| 变量名                        | 典型值                  | 说明                                     |
|------------------------------|-------------------------|------------------------------------------|
| NEXT_PUBLIC_ONLINE_DB_PROVIDER| supabase/firebase/自定义 | 远程/云端数据库类型                      |
| NEXT_PUBLIC_OFFLINE_DB_PROVIDER| sqlite/indexeddb/自定义  | 本地/离线数据库类型                      |
| NEXT_PUBLIC_DB_ORM           | drizzle/typeorm/none     | ORM/数据库访问层类型，none 表示不用 ORM |
| NEXT_PUBLIC_ENABLE_OFFLINE    | true/false              | 是否启用离线能力，通常与 offline/hybrid 配合 |
| NEXT_PUBLIC_ENABLE_HYBRID     | true/false              | 是否启用混合模式，配合 hybrid 场景         |
| NEXT_PUBLIC_SYNC_ENABLED      | true/false              | 是否开启本地与远程的数据同步               |
| NEXT_PUBLIC_SYNC_STRATEGY     | periodic/triggered      | 同步策略，定时还是事件触发                 |
| NEXT_PUBLIC_OFFLINE_DB_TYPE   | indexeddb/sqlite        | 本地数据库类型，决定离线数据存储实现       |
| NEXT_PUBLIC_ONLINE_DB         | supabase/firebase/sqlite| 远程数据库类型，决定云端数据服务           |
| NEXT_PUBLIC_OFFLINE_DB        | indexeddb/sqlite        | 本地数据库类型（与 OFFLINE_DB_TYPE 互补）  |
| NEXT_PUBLIC_MOCK_DB_MODE      | [已废弃]                | [已废弃] mock 阶段本地数据库类型           |
| NEXT_PUBLIC_SYNC_CONFLICT_RESOLUTION | server-wins/client-wins/merge | 同步冲突解决策略         |

### 3. 应用场景与配置示例

#### （1）纯在线模式（online-only）
- **典型配置**：
  - `NEXT_PUBLIC_DATA_MODE=online-only`
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase`
  - `NEXT_PUBLIC_DB_ORM=drizzle`
  - `NEXT_PUBLIC_ENABLE_OFFLINE=false`
  - `NEXT_PUBLIC_SYNC_ENABLED=false`
- **场景说明**：
  - 适用于对实时性要求高、网络环境稳定、无需本地缓存的场景（如后台管理系统、纯 Web SaaS）。
  - 所有数据操作均直接请求远程 API，前端不做本地持久化。
- **注意事项**：
  - ORM 类型需与 provider 匹配，如 supabase 推荐 drizzle。
  - 离线时功能不可用，刷新页面数据丢失。

#### （2）纯离线模式（offline-only）
- **典型配置**：
  - `NEXT_PUBLIC_DATA_MODE=offline-only`
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER=indexeddb`（Web）/`sqlite`（移动端）
  - `NEXT_PUBLIC_DB_ORM=none` 或 `drizzle`
  - `NEXT_PUBLIC_ENABLE_OFFLINE=true`
  - `NEXT_PUBLIC_SYNC_ENABLED=false`
- **场景说明**：
  - 适用于弱网、无网环境，或对隐私、响应速度要求极高的场景（如外业采集、移动端工具）。
  - 所有数据操作均在本地数据库完成，断网不影响正常使用。
- **注意事项**：
  - 若仅用原生 API 可设置 `NEXT_PUBLIC_DB_ORM=none`，如需 ORM 可选 drizzle。
  - 需要设计本地数据初始化、升级、备份等机制。
  - 数据无法自动与云端同步。

#### （3）混合模式（hybrid）
- **典型配置**：
  - `NEXT_PUBLIC_DATA_MODE=hybrid`
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase`
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER=indexeddb`
  - `NEXT_PUBLIC_DB_ORM=drizzle`
  - `NEXT_PUBLIC_ENABLE_OFFLINE=true`
  - `NEXT_PUBLIC_ENABLE_HYBRID=true`
  - `NEXT_PUBLIC_SYNC_ENABLED=true`
  - `NEXT_PUBLIC_SYNC_STRATEGY=periodic`（定时同步）或 `triggered`（事件驱动）
- **场景说明**：
  - 适用于既要离线可用、又要与云端保持数据一致的复杂业务（如笔记、任务、健康管理等 App）。
  - 用户可在无网时操作数据，联网后自动或手动同步。
  - 支持冲突解决策略（如 server-wins/client-wins/merge）。
- **注意事项**：
  - ORM 类型需能同时适配本地和远程 provider。
  - 需重点关注同步逻辑、冲突处理、数据一致性。
  - 本地与远程数据库结构需保持兼容。

---

**最佳实践补充：**
- 推荐始终成对配置 provider 和 ORM，避免 provider 与 ORM 不兼容导致运行异常。
- 业务代码统一通过配置服务读取 `NEXT_PUBLIC_ONLINE_DB_PROVIDER`、`NEXT_PUBLIC_OFFLINE_DB_PROVIDER` 和 `NEXT_PUBLIC_DB_ORM`，避免硬编码。
- 新增/变更 provider 或 ORM 类型需同步所有相关配置文件和文档。

---

## NEXT_PUBLIC_PROVIDER_TYPE 及相关变量详解

| NEXT_PUBLIC_MESSAGE_SERVICE_TYPE      | mock/remote              | 消息服务 Provider 类型                |
| NEXT_PUBLIC_NOTIFICATION_SERVICE_TYPE | mock/remote              | 通知服务 Provider 类型                |
| NEXT_PUBLIC_PAYMENT_SERVICE_TYPE      | revenuecat/mock          | 支付服务 Provider 类型                |
| NEXT_PUBLIC_QUIZ_SERVICE_TYPE         | mock/remote              | 测验服务 Provider 类型                |
| NEXT_PUBLIC_DATABASE_PROVIDER         | drizzle/sqlite/mock      | 数据库 Provider 类型                  |
| NEXT_PUBLIC_DB_ORM                   | drizzle/typeorm/none     | ORM/数据库访问层类型，none 表示不用 ORM |
| NEXT_PUBLIC_DATA_MODE                 | online-only/offline-only/hybrid | 数据访问模式，影响 Provider 选择 |
| NEXT_PUBLIC_API_ENV                   | local/dev/prod           | API 环境，间接影响 Provider 选择      |

- 各 Provider 类型变量可单独配置，支持不同服务独立切换（如数据 mock+认证 firebase）。
- `NEXT_PUBLIC_PROVIDER_TYPE` 可作为全局默认值，业务 Provider 变量可覆盖细分服务。

### 3. 应用场景与配置示例

#### （1）全局 mock 测试
- **典型配置**：
  - `NEXT_PUBLIC_PROVIDER_TYPE=mock`
  - `NEXT_PUBLIC_AUTH_SERVICE_TYPE=mock`
  - `NEXT_PUBLIC_USER_SERVICE_TYPE=mock`
  - ...
- **场景说明**：
  - 前端 UI/交互开发阶段，无需后端，所有服务走前端 mock provider。
- **注意事项**：
  - 适合快速原型、UI 测试，数据不落地。

#### （2）本地联调
- **典型配置**：
  - `NEXT_PUBLIC_PROVIDER_TYPE=local`
  - `NEXT_PUBLIC_DATABASE_PROVIDER=sqlite`
  - `NEXT_PUBLIC_AUTH_SERVICE_TYPE=mock`（或 local）
- **场景说明**：
  - 前后端本地联调，部分服务走本地实现，部分可继续 mock。
- **注意事项**：
  - 支持断点调试、离线测试。

#### （3）远程生产环境
- **典型配置**：
  - `NEXT_PUBLIC_PROVIDER_TYPE=remote`
  - `NEXT_PUBLIC_AUTH_SERVICE_TYPE=firebase`
  - `NEXT_PUBLIC_USER_SERVICE_TYPE=remote`
  - `NEXT_PUBLIC_DATABASE_PROVIDER=drizzle`
- **场景说明**：
  - 所有服务对接云端生产环境，数据、认证、消息等全部走远程 provider。
- **注意事项**：
  - 需保证 provider 配置与后端服务一致。

#### （4）混合/降级模式
- **典型配置**：
  - `NEXT_PUBLIC_PROVIDER_TYPE=hybrid`
  - `NEXT_PUBLIC_DATABASE_PROVIDER=sqlite`（或 supabase、firebase 等具体数据库实现）
  - `NEXT_PUBLIC_USER_SERVICE_TYPE=mock`（如部分服务降级）
- **场景说明**：
  - 业务主流程走远程服务，部分功能可降级为本地/mock，提升容错性。
- **注意事项**：
  - 需在代码中处理 provider 切换和降级逻辑。
  - `drizzle` 实际为 ORM 框架，不是具体数据库实现，数据库类变量建议填写具体实现（如 sqlite、supabase、firebase 等），`drizzle` 仅用于指定 ORM 层。

### 4. 实际代码用法示例

```typescript
// 统一获取 provider 类型，决定服务注册/实例化方式
const providerType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_PROVIDER_TYPE);
const userServiceType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_USER_SERVICE_TYPE) || providerType;

switch (userServiceType) {
  case 'mock':
    // 注册 mock user service
    break;
  case 'remote':
    // 注册远程 user service
    break;
  case 'local':
    // 注册本地 user service
    break;
}
```

### 5. 最佳实践与注意事项

- 推荐用 `NEXT_PUBLIC_PROVIDER_TYPE` 设全局默认，细分服务变量可覆盖，提升灵活性。
- 业务代码统一通过配置服务获取 provider 类型，避免硬编码。
- 新增/变更 provider 类型需同步所有相关配置文件和文档。
- 复杂场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界情况。

---

## 存储相关配置服务与演进式策略

本节结合“演进式策略”视角，按项目不同生命周期阶段，说明各类存储相关环境变量的推荐使用方式及变量搭配，帮助团队灵活适配不同需求与技术演进。

#### 1. 单一主库/最简阶段（原型开发、早期 MVP）
- **核心变量**：
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`（如 supabase、firebase 等）
  - `NEXT_PUBLIC_DB_ORM`（如 drizzle）
- **用法说明**：
  - 仅配置主数据库 provider 和 ORM，适合纯在线、云端场景。
  - 代码示例：
    ```typescript
    const dbProvider = configService.get(CONFIG_KEYS.NEXT_PUBLIC_ONLINE_DB_PROVIDER);
    const dbOrm = configService.get(CONFIG_KEYS.NEXT_PUBLIC_DB_ORM);
    ```
- **适用场景**：
  - 云端原型、SaaS、后台管理等。

#### 2. 支持离线/混合阶段（功能增强、移动端适配）
- **新增变量**：
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER`（如 indexeddb、sqlite）
  - `NEXT_PUBLIC_ENABLE_OFFLINE`、`NEXT_PUBLIC_ENABLE_HYBRID`
- **用法说明**：
  - 配合 `NEXT_PUBLIC_DATA_MODE` 控制数据访问模式，支持 hybrid（本地+远程）和 offline-only。
  - 代码示例：
    ```typescript
    const offlineDbProvider = configService.get(CONFIG_KEYS.NEXT_PUBLIC_OFFLINE_DB_PROVIDER);
    const dataMode = configService.get(CONFIG_KEYS.NEXT_PUBLIC_DATA_MODE);
    ```
- **适用场景**：
  - 移动端、弱网、需要离线能力的业务。

#### 3. 多层存储/高阶阶段（性能优化、业务扩展）
- **新增变量**：
  - `NEXT_PUBLIC_CACHE_PROVIDER`（如 redis、localstorage）
  - `NEXT_PUBLIC_FILE_STORAGE_PROVIDER`、`NEXT_PUBLIC_LOG_STORAGE_PROVIDER` 等
- **用法说明**：
  - 结合缓存、文件、日志等 provider，提升性能与业务弹性。
  - 代码示例：
    ```typescript
    const cacheProvider = configService.get(CONFIG_KEYS.NEXT_PUBLIC_CACHE_PROVIDER);
    const fileStorageProvider = configService.get(CONFIG_KEYS.NEXT_PUBLIC_FILE_STORAGE_PROVIDER);
    ```
- **适用场景**：
  - 需要缓存、归档、日志等多存储层次的复杂应用。

#### 4. 多环境/灰度/降级治理阶段（大规模运维、持续演进）
- **综合变量**：
  - `NEXT_PUBLIC_ENV_STAGE`、`NEXT_PUBLIC_PROVIDER_TYPE`、`NEXT_PUBLIC_DATA_MODE` 等
  - 各 provider 变量均可按环境、平台动态切换
- **用法说明**：
  - 通过配置服务统一分发，支持多环境、灰度发布、服务降级、mock/真实混用等。
  - 代码示例：
    ```typescript
    const envStage = configService.get(CONFIG_KEYS.NEXT_PUBLIC_ENV_STAGE);
    const providerType = configService.get(CONFIG_KEYS.NEXT_PUBLIC_PROVIDER_TYPE);
    // 动态切 provider
    ```
- **适用场景**：
  - 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。

---

**最佳实践与建议：**
- **渐进增强**：初期只需配置主数据库 provider，后续可按需扩展缓存、文件、日志等 provider，无需大改架构。
- **向后兼容**：新 provider 变量上线时，配置服务可同时兼容旧变量，逐步引导业务迁移。
- **多环境适配**：支持通过 ENV_STAGE、DATA_MODE 等变量动态切换 provider，满足 mock、本地、生产等多环境需求。
- **配置变更同步**：每次新增/变更 provider 变量，需同步 `.env.example`、`config-keys.ts`、`config-types.ts` 和文档，确保一致性。
- **灰度与降级**：可通过 provider 变量灵活实现服务降级、灰度发布、mock/真实混用等场景。
- **统一访问**：业务代码统一通过配置服务读取各 provider 变量，避免魔法字符串和硬编码。

---

## PWA 场景下的变量协同与注意事项
- `NODE_ENV` 决定基础构建优化与调试能力。
- `ENV_STAGE` 决定 API、provider、mock/真实等业务切换。
- `PLATFORM` 决定本地能力、UI/交互适配、推送等。
- `DATA_MODE` 决定数据主流程，影响 provider 选择与同步策略。
- provider 变量（如 ONLINE_DB_PROVIDER、OFFLINE_DB_PROVIDER、DB_ORM 等）需与上述环境变量协同配置，确保多端一致性和最佳体验。
- 业务代码应统一通过配置服务获取所有变量，禁止硬编码。

---

**最佳实践与建议：**
- 变量命名、类型、用途全链路同步（`.env.example`、`config-keys.ts`、`config-types.ts`、文档）。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。

---

## 配置服务（ConfigService）本身的 provider 变量说明

- **核心变量**：
  - `NEXT_PUBLIC_CONFIG_PROVIDER`：配置服务/参数中心类型（如 consul/etcd/ssm/localfile）。
- **用法说明**：
  - 决定配置服务（ConfigService）本身的后端实现来源，可支持本地文件、远程参数中心、云服务等多种模式，适配不同部署和运维需求。
  - 典型应用场景：
    - 本地开发/单机：`NEXT_PUBLIC_CONFIG_PROVIDER=localfile`
    - 云端/多环境：`NEXT_PUBLIC_CONFIG_PROVIDER=consul`、`etcd`、`ssm` 等
  - 业务代码通过配置服务统一读取所有环境变量和 provider 配置，确保类型安全、自动补全和多端一致性。
- **最佳实践**：
  - 配置服务 provider 变量与其他 provider 变量（如数据库、缓存、文件等）同等重要，需在 `.env.example`、`config-keys.ts`、`config-types.ts`、文档全链路声明和同步。
  - 推荐所有配置项都通过配置服务访问，禁止直读 process.env 或硬编码。

---

**最佳实践与建议：**
- 变量命名、类型、用途全链路同步（`.env.example`、`config-keys.ts`、`config-types.ts`、文档）。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。

---

## NEXT_PUBLIC_DB_ORM 及相关变量详解

`NEXT_PUBLIC_DB_ORM` 用于指定应用数据库的 ORM/访问层类型，是实现不同数据库访问策略的核心配置。它与 `DATABASE_PROVIDER` 协同，支持不同数据库类型和访问模式。

### 1. 变量定义与典型取值

- **NEXT_PUBLIC_DB_ORM**
  - 取值：`drizzle`、`typeorm`、`none` 等
  - 作用：决定应用数据库的 ORM/访问层类型
    - `drizzle`：使用 Drizzle ORM 框架
    - `typeorm`：使用 TypeORM 框架
    - `none`：不使用 ORM，直接访问数据库

### 2. 相关环境变量与协同关系

| 变量名                        | 典型值                  | 说明                                     |
|------------------------------|-------------------------|------------------------------------------|
| NEXT_PUBLIC_DATABASE_PROVIDER| mock/sqlite/drizzle      | 数据库 Provider 类型                  |
| NEXT_PUBLIC_DB_ORM           | drizzle/typeorm/none     | ORM/数据库访问层类型，none 表示不用 ORM |
| NEXT_PUBLIC_DATA_MODE        | online-only/offline-only/hybrid | 数据访问模式，影响 Provider 选择 |

- `DATABASE_PROVIDER` 指定数据库类型，`DB_ORM` 指定 ORM/访问层类型。
- `DB_ORM` 可以覆盖 `DATABASE_PROVIDER` 的默认 ORM 配置。

### 3. 应用场景与配置示例

#### （1）使用 Drizzle ORM
- **典型配置**：
  - `NEXT_PUBLIC_DATABASE_PROVIDER=drizzle`
  - `NEXT_PUBLIC_DB_ORM=drizzle`
- **场景说明**：
  - 使用 Drizzle ORM 框架访问数据库。
- **注意事项**：
  - 需要安装 Drizzle ORM 依赖。

#### （2）使用 TypeORM
- **典型配置**：
  - `NEXT_PUBLIC_DATABASE_PROVIDER=sqlite`
  - `NEXT_PUBLIC_DB_ORM=typeorm`
- **场景说明**：
  - 使用 TypeORM 框架访问 SQLite 数据库。
- **注意事项**：
  - 需要安装 TypeORM 依赖。

#### （3）不使用 ORM
- **典型配置**：
  - `NEXT_PUBLIC_DATABASE_PROVIDER=sqlite`
  - `NEXT_PUBLIC_DB_ORM=none`
- **场景说明**：
  - 直接访问 SQLite 数据库，不使用 ORM 框架。
- **注意事项**：
  - 需要手动编写数据库访问代码。

### 4. 实际代码用法示例

```typescript
// 获取数据库 ORM 类型
const dbOrm = configService.get(CONFIG_KEYS.NEXT_PUBLIC_DB_ORM);

switch (dbOrm) {
  case 'drizzle':
    // 使用 Drizzle ORM
    break;
  case 'typeorm':
    // 使用 TypeORM
    break;
  case 'none':
    // 不使用 ORM
    break;
}
```

### 5. 最佳实践与注意事项

- 推荐使用 ORM 框架简化数据库访问代码。
- 业务代码统一通过配置服务获取 ORM 类型，避免硬编码。
- 新增/变更 ORM 类型需同步所有相关配置文件和文档。
- 复杂场景下建议详细测试 ORM 切换、数据库访问等边界情况。

---

## PWA 场景下的变量协同与注意事项
- `NODE_ENV` 决定基础构建优化与调试能力。
- `ENV_STAGE` 决定 API、provider、mock/真实等业务切换。
- `PLATFORM` 决定本地能力、UI/交互适配、推送等。
- `DATA_MODE` 决定数据主流程，影响 provider 选择与同步策略。
- provider 变量（如 ONLINE_DB_PROVIDER、OFFLINE_DB_PROVIDER、DB_ORM 等）需与上述环境变量协同配置，确保多端一致性和最佳体验。
- 业务代码应统一通过配置服务获取所有变量，禁止硬编码。

---

**最佳实践与建议：**
- 变量命名、类型、用途全链路同步（`.env.example`、`config-keys.ts`、`config-types.ts`、文档）。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。

---

## 存储与运行环境配置服务的演进式策略（PWA架构实践）

本节结合 PWA 应用架构，围绕项目不同生命周期及多端适配，系统说明核心环境变量（`NEXT_PUBLIC_NODE_ENV`、`NEXT_PUBLIC_ENV_STAGE`、`NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_PLATFORM`、`NEXT_PUBLIC_CONFIG_PROVIDER` 等）与存储/配置服务 provider 变量的协同用法和演进式搭配，帮助团队灵活适配不同环境、平台和业务需求。

### 1. 生命周期与环境变量分层

- **运行环境变量**：
  - `NEXT_PUBLIC_NODE_ENV`：基础构建/运行环境（development/production/test），影响 PWA 打包优化、调试、日志等。
  - `NEXT_PUBLIC_ENV_STAGE`：业务/部署环境（mock/local/dev/prod），决定 API、provider、mock/真实等业务切换。
  - `NEXT_PUBLIC_PLATFORM`：平台类型（web/mobile），决定数据存储、推送、UI 适配等能力。
  - `NEXT_PUBLIC_DATA_MODE`：数据访问模式（online-only/offline-only/hybrid），决定数据流转主策略。

- **配置服务 provider 变量**：
  - `NEXT_PUBLIC_CONFIG_PROVIDER`：配置服务/参数中心类型（如 consul/etcd/ssm/localfile），决定 ConfigService 的后端实现。

- **存储/服务 provider 变量**：
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`、`NEXT_PUBLIC_OFFLINE_DB_PROVIDER`、`NEXT_PUBLIC_DB_ORM`、`NEXT_PUBLIC_CACHE_PROVIDER` 等

### 2. 不同阶段的变量搭配与推荐用法

#### （1）原型/开发初期（Web为主，快速迭代）
- 推荐配置：
  - `NEXT_PUBLIC_NODE_ENV=development`
  - `NEXT_PUBLIC_ENV_STAGE=mock` 或 `local`
  - `NEXT_PUBLIC_PLATFORM=web`
  - `NEXT_PUBLIC_DATA_MODE=online-only`
  - `NEXT_PUBLIC_CONFIG_PROVIDER=localfile`
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase`（或 mock）
  - `NEXT_PUBLIC_DB_ORM=drizzle`
- 用法说明：
  - 以云端或 mock provider 为主，便于快速开发、调试和 UI 迭代。
  - 结合 `NODE_ENV` 控制日志、调试、热更新。
  - 配置服务采用本地文件，便于单机开发和配置同步。

#### （2）移动端/离线能力增强阶段
- 推荐配置：
  - `NEXT_PUBLIC_NODE_ENV=production`
  - `NEXT_PUBLIC_ENV_STAGE=local` 或 `dev`
  - `NEXT_PUBLIC_PLATFORM=mobile`
  - `NEXT_PUBLIC_DATA_MODE=offline-only` 或 `hybrid`
  - `NEXT_PUBLIC_CONFIG_PROVIDER=localfile` 或云端参数中心
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER=sqlite`（移动端）/`indexeddb`（Web）
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase`（如 hybrid）
  - `NEXT_PUBLIC_DB_ORM=drizzle` 或 `none`
- 用法说明：
  - 充分利用 PWA 的本地存储能力，支持弱网/无网场景。
  - `PLATFORM` 决定本地存储方案，`DATA_MODE` 控制主/辅数据流。
  - 配置服务可本地或远程，支持多端配置同步。

#### （3）上线/多环境运维阶段
- 推荐配置：
  - `NEXT_PUBLIC_NODE_ENV=production`
  - `NEXT_PUBLIC_ENV_STAGE=prod`、`staging`、`dev`（按需）
  - `NEXT_PUBLIC_PLATFORM=web` 或 `mobile`
  - `NEXT_PUBLIC_DATA_MODE=hybrid` 或 `online-only`
  - `NEXT_PUBLIC_CONFIG_PROVIDER=consul`、`etcd`、`ssm` 等
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER=supabase`、`firebase` 等
  - `NEXT_PUBLIC_OFFLINE_DB_PROVIDER=sqlite` 或 `indexeddb`
  - `NEXT_PUBLIC_DB_ORM=drizzle`
- 用法说明：
  - 结合 CI/CD、灰度、A/B 测试等，动态切换 ENV_STAGE、PLATFORM、DATA_MODE，灵活适配多端多环境。
  - 业务代码通过配置服务自动适配 provider 变量，避免魔法字符串。
  - 配置服务采用云端参数中心，支持多环境动态配置和统一管理。

### 3. PWA 场景下的变量协同与注意事项
- `NODE_ENV` 决定基础构建优化与调试能力。
- `ENV_STAGE` 决定 API、provider、mock/真实等业务切换。
- `PLATFORM` 决定本地能力、UI/交互适配、推送等。
- `DATA_MODE` 决定数据主流程，影响 provider 选择与同步策略。
- `CONFIG_PROVIDER` 决定配置服务的后端实现，影响配置的集中管理能力。
- provider 变量（如 ONLINE_DB_PROVIDER、OFFLINE_DB_PROVIDER、DB_ORM 等）需与上述环境变量协同配置，确保多端一致性和最佳体验。
- 业务代码应统一通过配置服务获取所有变量，禁止硬编码。

---

**最佳实践与建议：**
- 变量命名、类型、用途全链路同步（`.env.example`、`config-keys.ts`、`config-types.ts`、文档）。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。

---

**配置服务（ConfigService）本身的 provider 变量说明**
- **核心变量**：
  - `NEXT_PUBLIC_CONFIG_PROVIDER`：配置服务/参数中心类型（如 consul/etcd/ssm/localfile）。
- **用法说明**：
  - 决定配置服务（ConfigService）本身的后端实现来源，可支持本地文件、远程参数中心、云服务等多种模式，适配不同部署和运维需求。
  - 典型应用场景：
    - 本地开发/单机：`NEXT_PUBLIC_CONFIG_PROVIDER=localfile`
    - 云端/多环境：`NEXT_PUBLIC_CONFIG_PROVIDER=consul`、`etcd`、`ssm` 等
  - 业务代码通过配置服务统一读取所有环境变量和 provider 配置，确保类型安全、自动补全和多端一致性。
- **最佳实践**：
  - 配置服务 provider 变量与其他 provider 变量（如数据库、缓存、文件等）同等重要，需在 `.env.example`、`config-keys.ts`、`config-types.ts`、文档全链路声明和同步。
  - 推荐所有配置项都通过配置服务访问，禁止直读 process.env 或硬编码。

---

**最佳实践与建议：**
- 变量命名、类型、用途全链路同步（`.env.example`、`config-keys.ts`、`config-types.ts`、文档）。
- 新增/变更 provider 或环境变量需同步所有相关配置和文档。
- 多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。
- 充分利用配置服务，提升代码健壮性与可维护性。

---

```
