# 服务层运行模式（Service Modes）与 Provider/Adapter 命名规范

> 本文档为 HeyTCM 项目所有服务（数据、业务、基础设施、客户端等）在不同开发阶段、运行环境下的模式与 provider/adapter 类型命名与适配规范，避免歧义，提升一致性。请所有开发、文档、测试严格参照本规范。

---

## 一、全局运行模式（Mode）定义

| 模式（Mode）      | 英文标识        | 说明                                                         |
|-------------------|-----------------|--------------------------------------------------------------|
| 纯在线模式        | online-only     | 仅依赖云端/远程服务，适用于生产/强一致性/云优先场景。         |
| 纯离线模式        | offline-only    | 仅依赖本地存储/数据库，适用于 mock/弱网/本地开发/隐私场景。   |
| 混合模式          | hybrid          | 本地与云端并存，断网自动降级本地，联网自动同步。              |

- **环境变量建议**：
  - `DATA_MODE=online-only|offline-only|hybrid`
  - `ENV_STAGE=mock|local|dev|prod`

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

三种模式（online-only、offline-only、hybrid）不仅影响数据服务，还会影响业务服务、基础设施服务、客户端服务等所有服务层的实现和行为：

### 1. 数据服务层（Data Services）
- 推荐根据 `DATA_MODE` 和 `providerType` 自动选择 adapter。
- mock 阶段用 mock-client，本地开发用 local/hybrid，生产用 remote/hybrid。
- 支持 schema、mock 数据、同步、迁移等。

### 2. 业务服务层（Business Services）
- 各业务服务（如用户、消息、支付等）应支持多 provider/adapter 类型，并能根据全局模式自动切换。
- 业务 hooks 层自动降级、mock、切换 provider。
- 例如：消息服务在 offline-only 模式下仅本地缓存，hybrid 模式下本地+云端自动同步。

### 3. 基础设施服务层（Infrastructure Services）
- 日志、网络、存储等基础设施服务也应支持 mock/local/remote/hybrid 实现。
- 日志建议 mock 阶段本地输出，生产远程收集。
- 网络服务 hybrid 模式下可支持离线缓存与同步。

### 4. 客户端服务层（Client Services）
- 推送、缓存、设备能力等客户端服务同样需支持多 provider/adapter 类型，适配不同运行模式。
- 例如：推送服务 mock 阶段不实际推送，offline-only 模式下本地模拟，hybrid/online 模式下对接真实推送平台。

---

## 四、典型环境与模式适配表

| 阶段       | DATA_MODE    | Provider/Adapter 推荐类型           | 说明                              |
|------------|--------------|-------------------------------------|-----------------------------------|
| mock       | offline-only | mock-client, mock-adapter           | 零配置自动 mock，开发体验最佳      |
| local      | offline/hybrid| local-adapter, hybrid-adapter       | 支持本地存储，部分表可混合同步      |
| dev        | hybrid/online| hybrid-adapter, remote-adapter      | 支持断网、自动降级、数据同步        |
| production | hybrid/online| hybrid-adapter, remote-adapter      | 云端为主，断网自动降级本地，自动同步 |

---

## 五、名词解释及注意事项

- **Mode（模式）**：指全局运行方式，影响所有服务层的适配和切换。
- **Provider/Adapter 类型**：指具体实现方式，需与全局模式适配。
- **环境变量**：用于配置当前运行阶段和模式，建议通过统一配置文件或 .env 管理。
- **严禁混用/歧义表达**：文档、代码、接口、配置中，必须严格区分 Mode 与 Provider/Adapter 类型。

---

## 六、Mock 阶段 Adapter 最佳实践说明（2025 更新）

### 极简 mock adapter 策略
- mock 阶段推荐仅使用**极简内存型 mock adapter**（如 MemoryMockDataServiceAdapter），保证开发体验极致简单。
- 该 adapter 数据仅存于内存，适合接口/schema 联调、UI 流程自测，**刷新页面或重启应用数据会丢失**。

### 何时需要持久化型 mock adapter？
- 仅在以下场景建议扩展持久化 mock adapter（如 json、localStorage、IndexedDB）：
  - 需要模拟“真实 app”体验（如演示、深度交互测试）
  - 自动化测试需要数据隔离或持久化
- 推荐实现方式：
  - Web 端可用 localStorage/IndexedDB mock adapter
  - Node 环境可用 json 文件 mock adapter
  - 这些 adapter 仅在特殊场景注册使用，主流程不强制依赖

### 业务流程与文档规范
- mock 阶段主流程只需注册/注入一种内存型 mock adapter
- 如需持久化体验，按需扩展并在注册表/工厂中选择性暴露
- 文档中应明确“mock 阶段不强制持久化，极简为主，持久化为可选增强”

---

## 七、参考与扩展

- 详细设计原则与最佳实践请参考 [../../src/core/services/service-design-guidelines.md](../../src/core/services/service-design-guidelines.md)
- 各服务 README 只需引用本规范，无需重复描述。

如有新模式、新类型或特殊适配场景，请补充本规范并全局同步。

### 【Mock 阶段适配原则更新】

> **在 mock 阶段，仅依赖 Mock Service 自动注入（Mock/Stub 支持）即可，无需实现内存、json、sqlite 等本地或远程存储 adapter。Mock Service 只需保证接口/schema 对齐，支持前端开发、自测、演示等所有探索场景。**
>
> - mock 阶段目标：接口可用、逻辑可测、无需真实存储。
> - 客户端缓存、在线存储等模拟在 mock 阶段无需区分，只需由 Mock Service 返回预设/内存数据。
> - 进入 local/hybrid/remote 阶段时，才需实现真实存储 adapter。

### 依赖与环境

- Mock Service 机制基于 TypeScript/JavaScript 生态，无需特殊依赖。
- 推荐配合自动化测试工具（如 jest、@testing-library/react-hooks）和 plop/hygen 等代码生成工具。
- 如需 Mock Service 自动注入，需保证 Registry/工厂模式已实现（本项目已内置）。
