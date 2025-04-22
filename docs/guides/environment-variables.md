# 环境变量规范（Environment Variables Guide）

> 本文档系统梳理 HeyTCM 项目中涉及的所有环境变量，说明其作用、典型取值、推荐配置方式及与服务模式、环境模式的关系。请所有开发、测试、运维严格参照本规范配置与使用环境变量。

---

## 一、环境变量的作用

- 控制项目在不同环境（mock、本地、开发、生产等）下的行为和配置
- 驱动服务模式（如 online-only、offline-only、hybrid）、数据库适配、API 路径、日志等级等
- 支持多环境切换、自动化部署、灰度发布、数据隔离等场景

---

## 二、核心环境变量说明

| 变量名            | 典型取值                        | 说明 |
|-------------------|----------------------------------|------|
| ENV_STAGE         | mock/local/dev/prod              | 当前环境模式，详见 [environment-modes.md](./environment-modes.md) |
| DATA_MODE         | online-only/offline-only/hybrid  | 服务层运行模式，详见 [service-modes.md](./service-modes.md) |
| API_BASE_URL      | http://localhost:3000 等         | 后端 API 基础地址 |
| DB_URL            | 本地/远程数据库连接串            | 数据库连接地址或类型 |
| LOG_LEVEL         | debug/info/warn/error            | 日志输出等级 |
| PROVIDER_TYPE     | mock/local/remote/hybrid         | 服务/适配器类型 |
| MOCK_DB_MODE      | mock-indexeddb/memory            | mock 阶段数据库类型 |
| ONLINE_DB         | supabase/firebase/xxx            | 远程数据库类型 |
| OFFLINE_DB        | indexeddb/sqlite/xxx             | 本地数据库类型 |
| FEATURE_FLAG      | enableX=true,enableY=false       | 功能开关，逗号分隔 |
| BRAND             | brandA/brandB                    | 多品牌适配 |
| SYNC_AUTO_ON_CONNECT | true/false                    | 网络恢复时自动同步 |
| SYNC_INTERVAL     | 60000（单位 ms）                 | 同步间隔 |
| SYNC_CONFLICT_RESOLUTION | server-wins/client-wins/merge | 冲突解决策略 |
| CONFIG_ADAPTER    | env/mock/remote                  | 配置服务适配器类型，决定配置读取优先级（如 env、mock、remote），详见 [config/README.md](../../src/core/services/infrastructure/config/README.md) |
| CDN_BASE_URL      | https://cdn.xxx.com               | 静态资源 CDN 路径 |
| NODE_ENV                 | development/test/production          | Node.js 运行环境，影响服务降级、mock、日志等（如开发/测试环境自动启用 mock 服务）。常由框架自动注入 |
| NEXT_PUBLIC_USE_MOCK     | true/false                           | 前端是否强制启用 mock 服务（如传感器、摄像头等），适合本地开发/演示/测试环境 |
| LOGGER_PROVIDER          | winston/默认省略                     | 日志服务适配器类型，决定日志实现（如 winston、默认 console） |
| R2_REGION                | auto/xxx                             | R2（对象存储）适配器使用的 region，仅对象存储适配器启用时必填 |
| R2_ENDPOINT              | https://xxx.r2.cloudflarestorage.com | R2 对象存储 endpoint，仅对象存储适配器启用时必填 |
| R2_ACCESS_KEY_ID         | ...                                  | R2 对象存储 access key id，仅对象存储适配器启用时必填 |
| R2_SECRET_ACCESS_KEY     | ...                                  | R2 对象存储 secret access key，仅对象存储适配器启用时必填 |
| R2_BUCKET                | ...                                  | R2 对象存储 bucket 名称，仅对象存储适配器启用时必填 |
| TG_BOT_TOKEN             | ...                                  | Telegram 机器人 token，仅启用 Telegram 适配器时必填 |
| TG_CHAT_ID               | ...                                  | Telegram 机器人 chat id，仅启用 Telegram 适配器时必填 |
| EMAIL_PROVIDER           | smtp/默认省略                        | 邮件服务适配器类型，决定邮件发送实现（如 smtp、默认 mock） |
| ENABLE_OFFLINE         | true/false         | 是否启用数据库离线模式，影响本地数据持久化与同步能力 |
| ENABLE_HYBRID          | true/false         | 是否启用数据库混合（本地+远程）模式，适合断网场景自动切换 |
| ONLINE_STORAGE_TYPE    | supabase/firebase  | 在线存储类型，决定远程数据库后端 |
| OFFLINE_STORAGE_TYPE   | indexeddb/sqlite   | 离线存储类型，决定本地数据库后端 |
| STORAGE_NAME           | app_database_xxx   | 存储名称，区分不同环境/用户/版本的数据隔离 |
| STORAGE_VERSION        | 1/2/3...           | 存储版本号，控制数据库结构升级与迁移 |
| SYNC_ENABLED           | true/false         | 是否启用数据同步，决定本地与远程数据一致性策略 |
| SYNC_STRATEGY          | manual/periodic    | 同步策略，手动或定时自动同步 |
| CONFLICT_RESOLUTION / SYNC_CONFLICT_RESOLUTION | client-wins/server-wins/last-write-wins | 数据冲突解决策略，client-wins 表示本地优先，server-wins 表示远程优先，last-write-wins 表示最后写入优先 |
| LOAD_TEST_DATA         | true/false         | 是否启动时加载测试数据，便于开发/自动化测试 |
| TEST_DATA_SOURCE       | example/dating     | 测试数据源类型，决定加载哪类测试数据 |

---

## 三、环境变量的配置方式

- 推荐统一通过 `.env` 文件或环境变量管理工具（如 cross-env、dotenv）配置
- 支持多环境配置文件：`.env.mock`、`.env.local`、`.env.dev`、`.env.prod` 等
- CI/CD 流程中自动注入环境变量，避免 hardcode
- 前端、后端、脚本等均应读取同一套环境变量

---

## 四、与服务模式、环境模式的关系

- `ENV_STAGE` 决定整体运行环境，`DATA_MODE` 决定服务层数据流转与适配
- 其它变量如 PROVIDER_TYPE、MOCK_DB_MODE、ONLINE_DB 等由环境和服务模式共同驱动
- 详见 [environment-modes.md](./environment-modes.md) 与 [service-modes.md](./service-modes.md)

---

## 五、最佳实践与注意事项

- 所有新增环境变量请补充本文件，并在相关文档引用
- 命名统一、语义清晰，避免 hardcode
- 变量值推荐通过配置文件/CI 注入，避免代码中直接写死
- 变量取值如有变更，需同步更新文档和配置示例
- 环境变量与全局配置服务的集成方式详见 [../../src/core/services/infrastructure/config/README.md](../../src/core/services/infrastructure/config/README.md)。

---

## 六、常见问题与扩展

- 如何扩展自定义变量？建议统一加前缀、补充说明
- 如何防止变量混用？CI 校验、配置隔离、文档同步
- 变量说明如有遗漏，请及时补充

---

## 七、环境变量命名、取值与作用域规范

### 1. 命名与取值标准化
- 所有环境变量命名须使用大写字母+下划线分隔（如 `ENV_STAGE`、`DATA_MODE`）。
- 变量取值应与本文件表格严格一致，如 dev/prod、online-only/offline-only/hybrid 等，禁止混用 development/production/test 等历史写法。
- 新增变量必须补充到本文件表格，并注明典型取值和说明。
- 推荐在代码中通过统一枚举/常量定义所有变量及取值，避免魔法字符串。

### 2. 统一环境变量读取与注入机制
- 推荐封装统一的 `getEnvVar(name: string, defaultValue?: any)` 工具函数，所有 hooks、db、service 均通过该工具读取变量。
- 变量优先从本地 .env 文件读取，其次读取 process.env，最后可通过启动参数/CI 注入。
- 支持多环境配置文件（.env.mock/.env.local/.env.dev/.env.prod），并允许本地覆盖云端变量。
- 禁止在业务代码中直接硬编码变量名或取值。

### 3. 文档与代码注释联动机制
- 每次变量新增/变更/废弃，必须同步更新本文件，并在相关代码/README 注释中引用本文件。
- 推荐在 CI 流程中增加变量一致性校验脚本（如扫描代码与本文件表格比对），发现遗漏自动提醒。
- 变量说明、默认值、取值范围等如有调整，需同步更新本文件和配置示例。

### 4. 变量作用域与隔离原则
- 全局变量（如 ENV_STAGE、DATA_MODE、API_BASE_URL）与模块级变量（如 SYNC_INTERVAL、BRAND、FEATURE_FLAG）需严格区分，避免全局污染。
- 各模块/服务/脚本初始化时，须主动声明所需环境变量及默认值。
- 避免在全局作用域下随意增删变量，推荐通过统一配置入口声明和管理。

---

## 平台与 API 相关变量

| 变量名                   | 典型取值           | 用途说明                                   |
|--------------------------|--------------------|--------------------------------------------|
| NEXT_PUBLIC_PLATFORM     | web/mobile/desktop | 指定当前运行的平台，影响接口行为与适配      |
| NEXT_PUBLIC_API_URL      | http(s)://...      | API 基础 URL，前后端通信地址                |

## 认证与服务类型相关变量

| 变量名                   | 典型取值           | 用途说明                                   |
|--------------------------|--------------------|--------------------------------------------|
| AUTH_TYPE                | mock/firebase/...  | 认证服务类型，mock 为本地模拟，firebase 等为真实后端 |

## 构建与版本信息相关变量

| 变量名                   | 典型取值           | 用途说明                                   |
|--------------------------|--------------------|--------------------------------------------|
| NEXT_PUBLIC_APP_VERSION  | 1.0.0/2.1.3        | App 版本号，展示于设置/关于页面，仅移动端有效 |
| NEXT_PUBLIC_BUILD_NUMBER | 1/20240422         | 构建号，CI/CD 自动注入，展示于设置/关于页面，仅移动端有效 |
| NEXT_PUBLIC_DATABASE_ENV | dev/prod/test      | 数据库环境，影响页面公开性/功能，仅移动端有效 |

---

> 配置示例：
>
> ```env
> # 平台与 API 相关变量
> NEXT_PUBLIC_PLATFORM=web
> NEXT_PUBLIC_API_URL=https://api.example.com
>
> # 认证服务类型
> AUTH_TYPE=mock
>
> # 构建与版本信息
> NEXT_PUBLIC_APP_VERSION=1.2.3
> NEXT_PUBLIC_BUILD_NUMBER=20240422
> NEXT_PUBLIC_DATABASE_ENV=dev
>
> # 数据库与同步相关
> ENABLE_OFFLINE=true
> ENABLE_HYBRID=false
> ONLINE_STORAGE_TYPE=supabase
> OFFLINE_STORAGE_TYPE=indexeddb
> STORAGE_NAME=heytcm_local
> STORAGE_VERSION=1
> SYNC_ENABLED=true
> SYNC_STRATEGY=manual
> CONFLICT_RESOLUTION=client-wins
> LOAD_TEST_DATA=false
> TEST_DATA_SOURCE=example
> ```

> 如有环境变量相关新需求或最佳实践，请先补充本文件并在相关文档引用。

---

## 变量与配置服务功能映射表

| 变量名                          | 主要影响/对应配置服务功能                   |
|---------------------------------|---------------------------------------------|
| NODE_ENV                        | 运行环境检测、日志级别、平台降级等           |
| NEXT_PUBLIC_PLATFORM            | 平台适配（API 路由、UI 渲染、功能开关）      |
| NEXT_PUBLIC_API_URL             | API 通信基地址，影响所有前后端请求            |
| AUTH_TYPE                       | 认证服务类型选择（如 mock、本地、Firebase）   |
| NEXT_PUBLIC_APP_VERSION         | App 版本展示、升级提示、埋点                 |
| NEXT_PUBLIC_BUILD_NUMBER        | 构建号展示、故障排查、版本回溯               |
| NEXT_PUBLIC_DATABASE_ENV        | 数据库适配、页面公开性、调试开关             |
| ENABLE_OFFLINE                  | 是否启用离线存储，影响数据持久化与同步        |
| ENABLE_HYBRID                   | 混合数据库模式切换（本地+远程自动切换）      |
| ONLINE_STORAGE_TYPE             | 在线数据库后端适配（Supabase/Firebase等）     |
| OFFLINE_STORAGE_TYPE            | 离线数据库后端适配（IndexedDB/SQLite等）     |
| STORAGE_NAME                    | 数据库命名空间隔离，防止数据串扰             |
| STORAGE_VERSION                 | 数据库结构升级与迁移                         |
| SYNC_ENABLED                    | 数据同步开关，决定本地与远程一致性           |
| SYNC_STRATEGY                   | 同步策略（手动/定时），影响同步触发机制       |
| CONFLICT_RESOLUTION             | 数据冲突解决策略，影响同步一致性             |
| LOAD_TEST_DATA                  | 启动时是否自动加载测试数据                   |
| TEST_DATA_SOURCE                | 指定加载哪类测试数据                         |
| LOGGER_PROVIDER                 | 日志服务实现选择（如 console、第三方等）      |
| R2_REGION/ENDPOINT/ACCESS_KEY   | 对象存储服务（如 R2）初始化与访问            |
| TG_BOT_TOKEN/TG_CHAT_ID         | Telegram 机器人服务初始化                    |
| EMAIL_PROVIDER                  | 邮件服务适配器选择                           |

> 如需扩展新变量，请同步补充本映射表，并在 config/README.md 说明其作用点。
