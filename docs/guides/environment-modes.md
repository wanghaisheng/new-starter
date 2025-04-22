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
  - `ENV_STAGE=mock|local|dev|prod`  // 当前环境模式
  - `DATA_MODE=online-only|offline-only|hybrid`  // 服务层运行模式，详见 [service-modes.md](./service-modes.md)
  - `API_BASE_URL`、`DB_URL`、`LOG_LEVEL` 等其它环境相关变量
- 各环境下可有专属的 `.env.mock`、`.env.local`、`.env.dev`、`.env.prod` 配置文件

---

## 三、各环境下的推荐配置与行为

- **mock**
  - 全部服务采用 mock provider，数据本地存储，适合前端快速开发/演示/单测
  - 通常对应 `DATA_MODE=offline-only`
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

1. 通过 `.env` 或启动参数切换 `ENV_STAGE` 和相关变量
2. 推荐前端、后端、脚本等均读取同一套环境变量
3. CI/CD 流程中自动注入或切换环境变量，实现自动化部署

---

## 五、与服务模式的关系

- 环境模式决定整体运行环境，服务模式（见 [service-modes.md](./service-modes.md)）决定服务层数据流转与适配。
- 例如：mock 环境通常对应 offline-only 服务模式，prod 环境通常对应 online-only 或 hybrid。
- 两者需配合配置，避免混淆。

---

## 六、最佳实践与注意事项

- 环境变量命名统一、语义清晰，避免 hardcode
- 文档、代码、脚本、CI/CD 配置均应引用本规范
- 如需新增环境或特殊场景，优先补充本文件并在其它文档引用

---

## 七、常见问题与扩展

- 如何新增自定义环境？建议以 `ENV_STAGE=xxx` 方式扩展，并补充配置说明
- 如何防止环境混用？CI/CD 自动校验、配置隔离、权限分级
- 其它环境变量推荐见各子模块 README

---

## 八、环境模式在统一配置体系中的作用与最佳实践

本节系统梳理项目各层（服务、数据、同步、迁移等）文档中与环境模式相关的核心内容，作为后续统一配置和环境切换的基石。

### 1. 环境模式与服务适配

- 所有服务（数据、业务、基础设施、客户端等）均需支持多环境（mock、本地、开发、生产），保证接口一致、行为可控。
- 环境切换应通过环境变量（如 `ENV_STAGE`、`DATA_MODE` 等）驱动，无需修改业务代码，仅需调整配置。
- 推荐所有服务注册、工厂、适配器实现均支持根据当前环境自动选择最优 provider/adapter，并支持热切换、降级、mock。
- 典型 provider 类型：mock、local、remote、hybrid、brandA/brandB 等，具体选择由环境变量及配置项决定。

### 2. 环境变量与配置文件

- 推荐统一使用 `.env.mock`、`.env.local`、`.env.dev`、`.env.prod` 等多环境配置文件，所有环境变量（如 API_BASE_URL、DB_URL、LOG_LEVEL、MOCK_DB_MODE、ONLINE_DB、OFFLINE_DB）集中管理。
- 主要环境变量：
  - `ENV_STAGE=mock|local|dev|prod`：当前环境模式
  - `DATA_MODE=online-only|offline-only|hybrid`：服务层运行模式
  - `MOCK_DB_MODE`、`ONLINE_DB`、`OFFLINE_DB`：数据库适配器类型
  - 其它如 providerType、apiBaseUrl、featureFlag、brand、testData 等
- 所有脚本、服务、前后端均应读取同一套环境变量，避免 hardcode。

### 3. 环境切换与开发流程

- 支持通过启动参数或脚本快速切换环境，如 `bun run dev --env=mock`，无需修改代码。
- CI/CD 流程自动注入环境变量，实现自动化部署、测试与灰度发布。
- 环境切换应支持跨环境数据复用、快速切换开发环境、减少环境配置工作。
- 典型场景：
  - mock 阶段全量 mock provider，零配置自动 mock，开发体验最佳
  - local 阶段本地数据库、本地 API，便于断点和调试
  - dev 阶段连接云端测试数据库、API，允许部分 mock
  - prod 阶段连接生产数据库、API，所有功能真实可用

### 4. 环境与数据层/同步/迁移的关系

- 数据服务层采用统一接口（如 `IDataService`），所有数据访问操作（包括 Mock、SQLite、Firebase 等）都通过该接口进行，保证业务逻辑与底层数据实现彻底解耦。
- 封装具体数据库驱动（如 SQLite、Firebase、Mock），并根据环境变量自动选择。
- 支持 mock、local、development、production 等多种 DatabaseEnvironment 类型。
- 同步管理器、迁移脚本等均需支持跨环境操作，典型迁移如 mock→local、local→production。
- 迁移配置需明确区分源环境和目标环境，支持多环境数据迁移、初始化和批量导入。

### 5. 服务层环境适配与注册表工厂

- 所有服务应通过注册表/工厂统一注册和获取实例，支持多 provider/adapter 自动切换。
- hooks/页面/业务层只能通过注册表注入服务，便于 mock、扩展和统一管理。
- 工厂/注册表应根据环境变量自动选择最优实现，并支持热切换、降级、mock。
- 基础设施服务（infrastructure）负责与外部系统、第三方服务、平台能力的集成和适配，专注于技术实现和环境抽象。
- 推荐目录结构：每个 provider（如 logger、network、email、config 等）均采用 adapters/factory/registry/service/types/index.ts 结构，便于扩展和 mock。

### 6. 典型环境与服务/数据/同步适配表

| 阶段       | ENV_STAGE    | DATA_MODE    | Provider/Adapter 推荐类型           | 说明                              |
|------------|--------------|-------------|-------------------------------------|-----------------------------------|
| mock       | mock         | offline-only| mock-client, mock-adapter           | 零配置自动 mock，开发体验最佳      |
| local      | local        | offline/hybrid| local-adapter, hybrid-adapter       | 支持本地存储，部分表可混合同步      |
| dev        | dev          | hybrid/online| hybrid-adapter, remote-adapter      | 支持断网、自动降级、数据同步        |
| production | prod         | hybrid/online| hybrid-adapter, remote-adapter      | 云端为主，断网自动降级本地，自动同步 |

- 环境变量决定工厂/注册表选择哪种 adapter/数据库/同步策略。
- 工厂/注册表应支持根据环境自动选择最优实现。

### 7. 其它最佳实践与注意事项

- 环境变量命名统一、语义清晰，避免 hardcode
- 文档、代码、脚本、CI/CD 配置均应引用本规范
- 如需新增环境或特殊场景，优先补充本文件并在其它文档引用
- 支持多 provider/多实例/动态扩展/运行时注册，满足 mock/remote/品牌定制/灰度等多场景
- 基础设施服务应支持 mock、自动降级、环境切换等能力，便于开发和测试

### 8. Mock 阶段适配原则更新

> **mock 阶段只需依赖 Mock Service 自动注入，无需实现本地（如 IndexedDB/SQLite）或远程（如 Supabase/Firebase）等真实 adapter。Mock Service 保证接口/schema 对齐，支持前端开发和自测。**
>
> - mock 阶段主要用于接口未上线、前端探索和联调。
> - 客户端缓存、在线存储等模拟在 mock 阶段无需区分，只需由 Mock Service 返回预设/内存数据。
> - 进入 local/hybrid/remote 阶段时，才需实现真实 adapter。

### 9. 依赖与环境

- Mock Service 机制基于 TypeScript/JavaScript，无需特殊依赖。
- 推荐配合 jest/@testing-library/react、plop 等工具。
- 只需保证 Registry/工厂模式可用（本项目已支持）。

---

> 如有环境相关新需求或最佳实践，请先补充本文件并在相关文档引用。
