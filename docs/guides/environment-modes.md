# 环境模式（Environment Modes）与环境变量规范

> 本文档说明 HeyTCM 项目各类运行环境（mock、local、dev、prod 等）的定义、用途、环境变量配置及与服务模式的关系，帮助开发、测试、运维团队统一理解和操作。

---

## 一、环境模式定义

| 环境模式 | 英文标识 | 典型用途 | 说明 |
|----------|----------|----------|------|
| 模拟环境 | mock     | 单元测试、接口 mock、无后端依赖 | 全量使用 mock 服务和假数据，零配置，快速开发和演示 |
| 本地开发 | local    | 本地开发、调试 | 本地数据库、本地 API、可选 mock，便于断点和调试 |
| 开发环境 | dev      | 联调、团队测试 | 连接云端开发数据库、测试 API，有部分真实数据 |
| 生产环境 | prod     | 上线、正式发布 | 连接生产数据库、真实 API，数据安全和高可用 |

---

## 二、环境变量与配置建议

- 推荐统一通过 `.env` 文件或环境变量管理各环境配置。
- 主要环境变量说明：
  - `NEXT_PUBLIC_NODE_ENV=development|production|test`  // 基础构建/运行环境，影响打包、调试、日志等
  - `NEXT_PUBLIC_ENV_STAGE=mock|local|dev|prod`  // 当前环境模式
  - `NEXT_PUBLIC_DATA_MODE=online|offline|hybrid`  // 服务层运行模式，详见 [service-modes.md](./service-modes.md)
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`、`NEXT_PUBLIC_OFFLINE_DB_PROVIDER` // 数据服务 provider
  - `NEXT_PUBLIC_PLATFORM=web|mobile`
  - `CACHE_STRATEGY=memory/localstorage/redis`  // 多级缓存策略，决定缓存层级与实现
  - `OFFLINE_FALLBACK=true/false`  // 断网自动切换，启用 hybrid/offline fallback
  - `EXPIRY_STRATEGY=none/ttl/lru`  // 失效策略，缓存/数据过期处理方式
  - 其它如 `API_BASE_URL`、`DB_URL`、`LOG_LEVEL` 等环境相关变量
- 各环境下可有专属的 `.env.mock`、`.env.local`、`.env.dev`、`.env.prod` 配置文件
- 所有 key 推荐集中在 config-keys.ts，禁止业务代码硬编码

---

## 三、各环境下的推荐配置与行为

- **mock**
  - 全部服务采用 mock provider，数据本地存储，适合前端快速开发/演示/单测
  - 通常对应 `NEXT_PUBLIC_DATA_MODE=offline`
- **local**
  - 本地数据库、本地 API，可选 hybrid provider
  - 适合功能开发、断点调试
- **dev**
  - 连接云端测试数据库、API，允许部分 mock
  - 适合团队联调、接口测试
- **prod**
  - 连接生产数据库、API，所有功能真实可用，严格权限与监控

---

## 四、环境切换与开发流程

1. 通过 `.env` 或启动参数切换 `NEXT_PUBLIC_ENV_STAGE` 和相关变量
2. 推荐前端、后端、脚本等均读取同一套环境变量
3. CI/CD 流程中自动注入或切换环境变量，实现自动化部署

---

## 五、与服务模式的关系

- 环境模式决定整体运行环境，服务模式（见 [service-modes.md](./service-modes.md)）决定服务层数据流转与适配。
- 例如：mock 环境通常对应 offline 服务模式，prod 环境通常对应 online 或 hybrid。
- 两者需配合配置，避免混淆。

---

## 六、最佳实践与注意事项

- 环境变量命名统一、语义清晰，避免 hardcode
- 文档、代码、脚本、CI/CD 配置均应引用本规范
- 所有环境变量 key 推荐统一 config-keys.ts 管理，禁止硬编码
- 如需新增环境或特殊场景，优先补充本文件并在其它文档引用

---

## 七、常见问题与扩展

- 如何新增自定义环境？建议以 `NEXT_PUBLIC_ENV_STAGE=xxx` 方式扩展，并补充配置说明
- 如何防止环境混用？CI/CD 自动校验、配置隔离、权限分级
- 其它环境变量推荐见各子模块 README

---

## 八、环境模式在统一配置体系中的作用与最佳实践

- 环境模式与服务模式（数据、业务、基础设施等）需配套设计，所有适配/切换均通过配置服务和统一 key 管理
- 推荐所有配置项、provider、模式变量均通过 ConfigService 访问，禁止直接读取 process.env
- 典型场景：
  - mock 阶段全量 mock provider，零配置自动 mock，开发体验最佳
  - local 阶段本地数据库、本地 API，便于断点和调试
  - dev 阶段连接云端测试数据库、API，允许部分 mock
  - prod 阶段连接生产数据库、API，所有功能真实可用

---

> 详细环境变量与服务模式说明见 [environment-variables.md](./environment-variables.md) 和 [service-modes.md](./service-modes.md)
