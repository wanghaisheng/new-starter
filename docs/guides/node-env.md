# NEXT_PUBLIC_NODE_ENV 变量说明

> 本文档详细说明 HeyTCM 项目中 `NEXT_PUBLIC_NODE_ENV` 环境变量的定义、取值、用途及与其它环境变量的关系，帮助开发、测试、运维团队统一理解和正确使用。

---

## 1. 变量定义与典型取值

- **变量名**：`NEXT_PUBLIC_NODE_ENV`
- **典型取值**：
  - `development` —— 开发环境，默认启用调试、详细日志、热重载等开发特性。
  - `production` —— 生产环境，启用构建优化、性能增强、关闭调试和敏感日志。
  - `test` —— 测试环境，适配自动化测试、mock、覆盖率统计等。

> 该变量与 Node.js 生态中的 `NODE_ENV` 语义一致，但通过 `NEXT_PUBLIC_` 前缀暴露给前端代码，确保前后端环境一致。

---

## 2. 应用场景与 HeyTCM PWA 全生命周期

### 2.1 PWA 应用全生命周期中的作用

- **开发阶段**：
  - `NEXT_PUBLIC_NODE_ENV=development`，启用热重载、详细报错、mock 数据、调试工具。
  - 支持本地存储（IndexedDB/SQLite）、本地 mock provider，前端开发体验最佳。

- **测试与联调阶段**：
  - `NEXT_PUBLIC_NODE_ENV=test`，适配自动化测试、端到端测试、接口 mock、覆盖率采集。
  - 可与 `NEXT_PUBLIC_ENV_STAGE=mock|dev` 配合，支持 mock/真实 API 混用。

- **预发布/灰度阶段**：
  - `NEXT_PUBLIC_NODE_ENV=production`，但可配合 `NEXT_PUBLIC_ENV_STAGE=dev`，用于灰度、预发布、真实 API 测试。
  - 启用部分优化、关闭调试入口，监控与埋点上线。

- **生产环境阶段**：
  - `NEXT_PUBLIC_NODE_ENV=production`，`NEXT_PUBLIC_ENV_STAGE=prod`。
  - 启用所有性能优化、关闭调试和 mock，所有数据流转与服务均为真实线上环境。
  - PWA 特有：Service Worker 注册、缓存策略、离线恢复、数据同步等均按生产标准执行。

### 2.2 典型 PWA 场景下的变量联动

- **Service Worker 行为**：根据 `NEXT_PUBLIC_NODE_ENV` 控制缓存策略、调试面板、日志输出。
- **数据同步与恢复**：开发/测试阶段可模拟离线、断网恢复；生产环境下启用真实同步、冲突解决。
- **Provider 切换**：本地开发用 mock/local provider，生产用 remote/hybrid provider，均通过环境变量自动切换。
- **多端适配**：结合 `NEXT_PUBLIC_PLATFORM`，自动适配 web/mobile 端特性。
- **CI/CD 流程**：自动注入对应变量，保证打包、部署、回归测试等流程环境一致。

---

## 3. 主要用途与影响

- **构建优化**：前端/后端构建工具（如 Next.js、Webpack、Vite 等）会根据该变量自动优化打包、Tree Shaking、代码分割等。
- **调试与日志**：`development` 模式下启用详细日志、错误堆栈、开发者工具；`production` 下关闭调试输出，减少安全风险。
- **条件分支**：代码中可根据该变量动态切换行为（如 mock/真实 API、性能采集、埋点、UI 调试入口等）。
- **CI/CD 流程**：自动化部署、测试、灰度发布等流程可通过该变量区分环境，注入不同配置。
- **PWA/多端适配**：影响 Service Worker 注册、缓存策略、调试面板等。

---

## 4. 与其它环境变量的关系

- `NEXT_PUBLIC_NODE_ENV` 决定底层运行环境，与 `NEXT_PUBLIC_ENV_STAGE`（业务/部署环境，如 mock/local/dev/prod）配合使用，区分技术环境与业务环境。
- `NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_ONLINE_DB_PROVIDER` 等业务变量通常依赖于 `NEXT_PUBLIC_NODE_ENV` 的取值进行默认配置。
- 推荐所有配置服务、工厂、注册表等均支持读取该变量，实现多环境自动切换。

---

## 5. 最佳实践

- **统一入口**：所有环境变量应通过配置服务（如 ConfigService）统一管理，禁止业务代码硬编码或直接读取 `process.env.NODE_ENV`。
- **同步文档**：如需新增/修改该变量，需同步 `.env.example`、`config-keys.ts`、`config-types.ts` 及相关文档。
- **多端一致性**：确保前后端、脚本、CI/CD 流程均使用一致的 `NEXT_PUBLIC_NODE_ENV`，避免环境混淆。
- **条件导入**：建议用类型安全的配置接口访问该变量，便于自动补全和静态检查。

---

## 6. 常见问题与注意事项

- **与 `NODE_ENV` 的区别**：`NODE_ENV` 是 Node.js 标准变量，`NEXT_PUBLIC_NODE_ENV` 通过前缀暴露给前端，确保全栈一致。
- **环境变量注入**：Next.js/Vite 等框架需在构建/运行时正确注入该变量，否则前端代码无法获取真实环境。
- **安全性**：生产环境切勿在 `development` 模式下部署，避免敏感信息泄露。
- **兼容性**：部分三方库可能仅识别 `NODE_ENV`，如需兼容需同步赋值。

---

> 如需扩展更多环境变量或特殊场景，请补充本文件并同步至主文档和配置服务。
