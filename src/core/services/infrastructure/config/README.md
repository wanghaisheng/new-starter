# Config Service & 全局配置最佳实践

本目录用于管理全局配置服务（ConfigService），提供应用运行期的全局参数、环境变量、远程下发配置等统一入口。

---

## 一、全局配置适用场景（详细说明）

### 1. API 基础地址、CDN 路径、环境变量
- **说明**：所有前端请求的基础 API 地址、静态资源 CDN 路径、构建时和运行时环境变量（如 dev/prod/test）等。
- **典型需求**：前端需根据环境自动切换后端地址、静态资源域名，保障开发、测试、生产环境隔离。
- **用法**：通过 config 统一下发，页面/服务用 `useConfig().apiBaseUrl` 获取。

### 2. 远程下发的 Feature Flag、实验开关、广告策略
- **说明**：由后端/运营后台动态控制的功能开关、A/B 实验参数、广告展示策略等。
- **典型需求**：无需发版即可灰度发布新功能、动态调整实验参数、远程关闭故障功能。
- **用法**：通过 config 下发，页面用 `useConfig().featureFlags` 判断是否渲染新功能。

### 3. 全局主题色、品牌色、全局样式参数
- **说明**：影响全局 UI 风格的主题色、品牌色、字体、圆角等样式参数。
- **典型需求**：统一品牌形象、支持一键切换 dark/light 主题、节日皮肤等。
- **用法**：通过 config 提供，组件用 `useConfig().theme` 获取。

### 4. 当前语言（如需全局切换）、多语言配置
- **说明**：决定全局文案、日期格式、货币格式等的当前语言、区域设置。
- **典型需求**：支持用户/系统一键切换多语言，提升国际化体验。
- **用法**：通过 config 提供，`useConfig().language` 控制全局文案渲染。

### 5. 其它影响全局行为的参数
- **说明**：如最大上传文件大小、全局超时、全局轮询频率、全局提示语、CDN 路径等。
- **典型需求**：保障全局一致性、便于后端/运维统一调整。
- **用法**：通过 config 提供，相关页面/服务读取。

---

## 二、渐进式配置方案与最佳实践

本项目采用**渐进式配置适配器架构**，支持从本地配置到集中配置中心的平滑演进，适应不同阶段的业务规模和弹性需求。

> **更多关于渐进式适配器策略的设计理念与最佳实践，详见 [docs/guides/progressive-adapter-strategy.md](../../../../../../docs/guides/progressive-adapter-strategy.md)。**

### 1. 方案演进阶段

#### 阶段一：本地/环境变量驱动
- 仅启用 EnvConfigAdapter（process.env/.env 文件）。
- 适合开发、测试、小规模生产环境。
- 业务层统一通过 configService 访问配置，禁止直连 process.env。

#### 阶段二：本地缓存 + 环境变量
- 增加本地缓存（如 LocalStorage/IndexedDB/文件等）adapter。
- 优先读本地缓存，miss 时 fallback 到环境变量。
- 支持部分热更新和持久化。

#### 阶段三：集中配置中心 + 本地缓存
- 启用 RemoteConfigAdapter（如 Apollo、Consul、Firebase Remote Config 等）。
- 通过 CompositeAdapter 组合远程配置中心和本地缓存，实现优先本地、自动同步、容灾回退。
- 适合大规模、分布式、需动态热更新的生产环境。

### 2. 切换机制与配置
- 切换仅需调整 `CONFIG_ADAPTER` 环境变量，无需改动业务代码。
- 典型配置：
  - `CONFIG_ADAPTER=env`（默认）
  - `CONFIG_ADAPTER=local+env`
  - `CONFIG_ADAPTER=remote+cache`
- config-factory.ts 根据环境变量动态组合适配器。

### 3. 业务层零侵入
- 业务代码始终通过 `configService.get(key)` 访问配置，无需关心底层来源与落地。
- 支持平滑升级、回滚，极大提升可维护性和弹性。

### 4. 推荐实践
- 业务禁止直接访问 process.env，统一通过 configService。
- 新增 adapter 时实现 IConfigAdapter 并注册到工厂。
- 变量/适配器变更需同步更新本文件及 environment-variables.md。
- 推荐在 CI 中校验关键配置项文档与代码一致性。

---

## 三、不建议放入全局配置的内容（详细说明）

### 1. 用户个性化/偏好设置
- **说明**：如用户专属主题、隐私设置、通知偏好、快捷方式等。
- **理由**：与用户强绑定，随用户切换，变化频繁，需持久化。
- **用法**：通过 useUserSetting/useSetting 等 hooks 单独管理。

### 2. 仅某业务/页面用到的临时状态
- **说明**：如聊天分页参数、页面过滤条件、局部排序方式等。
- **理由**：只在特定页面/模块用到，放入全局会污染命名空间。
- **用法**：通过 useChat/useFilter/useSort 等 hooks 管理。

### 3. 高频变化、与全局无关的本地 UI 状态
- **说明**：如弹窗开关、表单输入、局部 loading/error 状态等。
- **理由**：仅组件内用，放入全局会导致不必要的重渲染。
- **用法**：用 useState/useReducer 或局部 hooks 管理。

---

## 四、最佳实践

- 全局配置建议通过 `ConfigService` + `ConfigRegistry` 管理，并通过统一 hook（如 `useConfig`）获取。
- 用户偏好、业务专属状态建议通过独立 hooks（如 `useSetting`、`useUserSetting`）管理。
- 具体区分标准详见下表：

| 配置/状态         | 适合全局 config | 适合单独 hook      | 说明/理由                       |
|------------------|:--------------:|:-----------------:|-------------------------------|
| API 地址         |      ✅         |                   | 所有请求一致，运维统一下发      |
| 主题（全局）      |      ✅         |                   | 影响全局，需响应式              |
| 主题（用户偏好）  |                |        ✅          | 用户个性化，随用户切换          |
| 当前语言         |      ✅         |                   | 全局文案切换                    |
| 用户隐私设置     |                |        ✅          | 用户专属，需持久化              |
| Feature Flag     |      ✅         |                   | 远程下发，影响全局              |
| 页面过滤条件     |                |        ✅          | 仅页面内用                      |
| 广告策略         |      ✅         |                   | 远程控制，影响全局              |
| 聊天分页参数     |                |        ✅          | 仅聊天模块用                    |

---

## 五、参考用法

- 获取全局配置：
  ```ts
  import { useConfig } from '@/core/hooks/useConfig';
  const config = useConfig();
  ```
- 定义和扩展全局配置字段请统一在 ConfigService 及类型文件内维护。

---

## 六、Translation（多语言内容）集成说明

### 1. 多语言内容加载策略
- 支持从数据库表（translations）加载，也支持从 TypeScript 配置文件（translation.mock.ts）加载。
- 推荐开发/测试环境优先加载本地 mock 配置，生产环境优先数据库。
- 可配置优先级、fallback 策略（如数据库缺失时自动回退到 mock 文件）。

### 2. 配置型与动态型多语言内容
- 配置型（如礼物、标签等）：建议每项内嵌 nameI18n 字段，ConfigService 初始化时自动 set 到 config。
- 动态型（如全局文案、页面提示）：统一进 translations 表，支持后台管理。
- ConfigService.initialize() 会自动加载 translation.mock.ts 并 set('translationMockData', ...)。

### 3. 统一用法
- 业务代码通过 useTranslations/useTranslationService 获取内容，无需关心底层数据源。
- 需要原始 mock 数据时可通过 ConfigService.get('translationMockData') 获取。
- 推荐 hooks/service 层实现多源合并与 fallback。

### 4. 示例
```ts
import { useConfig } from '@/core/hooks/useConfig';
const config = useConfig();
const translationMock = config.get('translationMockData');
```

### 5. 扩展建议
- 可支持远程配置、A/B 测试、热更新等高级场景。
- translation.mock.ts 可作为内容兜底或测试基线。
- 建议所有 mock/config 资源加载方式保持一致，便于维护和切换。

---

## 七、与环境变量集成的最佳实践

### 1. 自动集成核心环境变量
- ConfigService 初始化时应自动将核心环境变量（如 ENV_STAGE、API_BASE_URL、DATA_MODE 等）注入到配置中心（store），确保所有全局配置项统一入口、统一管理。
- 建议通过白名单方式筛选需要注入的环境变量，避免无关变量污染全局配置。

### 2. 业务层只通过 Config 获取配置
- 业务代码、hooks、服务、数据层等禁止直接读取 process.env，统一通过 ConfigService（如 config.get('API_BASE_URL')）获取所有环境相关配置。
- 便于后续支持远程配置、动态参数、mock、热更新等高级场景，提升可维护性和可测试性。

### 3. 配置优先级与覆盖机制
- 推荐顺序：本地 .env 文件 > 环境变量 > 远程配置 > 默认值。
- ConfigService 支持多级配置源，优先级高的覆盖低的，保证本地开发、云端部署、灰度发布等场景下配置灵活可控。

### 4. 文档与代码同步
- 每次新增或修改环境变量，需同步更新 environment-variables.md 和本 README，并在代码注释中明确变量来源和用途。
- 推荐在 CI 流程中增加环境变量与 config 配置一致性校验，防止遗漏和不一致。

### 5. 典型用法示例

```ts
// ConfigService 初始化时自动注入环境变量
const ENV_KEYS = ['ENV_STAGE', 'API_BASE_URL', 'DATA_MODE', ...];
ENV_KEYS.forEach(key => {
  if (process.env[key] !== undefined) {
    configService.set(key, process.env[key]);
  }
});

// 业务层统一通过 configService 获取配置
const apiUrl = configService.get('API_BASE_URL');
```

---

## 适配器模式与环境变量自动注入实现说明

### 目录结构

```
src/core/services/infrastructure/config/
├── adapters/
│   ├── env-config-adapter.ts      # 从 process.env/.env 文件读取
│   ├── remote-config-adapter.ts   # 远程配置中心
│   └── mock-config-adapter.ts     # 本地 mock
├── factory/
│   └── config-factory.ts          # 工厂，根据环境变量选择 adapter
├── service/
│   └── config-service.ts          # 核心服务，组合/委托到 adapter
├── types/
│   └── config-adapter.types.ts    # 适配器接口定义
├── index.ts                       # 统一导出 configService
```

### 主要实现要点

- **ConfigAdapter**：抽象不同配置源，支持 env、mock、remote。
- **ConfigFactory**：根据 `CONFIG_ADAPTER` 环境变量动态选择配置源，支持热切换。
- **ConfigService**：组合 adapter，提供统一 get/set/has/remove 接口。
- **自动注入环境变量**：env adapter 自动收集 ENV_STAGE、API_BASE_URL、DATA_MODE 等白名单变量。
- **业务层统一读取**：所有配置统一通过 `configService.get(key)` 访问，禁止直接访问 process.env。

### 使用示例

```ts
import { configService } from '@/core/services/infrastructure/config';

await configService.initialize();
const apiBaseUrl = configService.get('API_BASE_URL');
```

### 扩展与维护

- 新增配置源时实现 IConfigAdapter 接口并注册到工厂。
- 变量/适配器变更需同步更新本文件及 environment-variables.md。
- 推荐在 CI 中校验关键配置项文档与代码一致性。

---

## 配置服务注入与读取方式统一（标准化说明）

### 1. 变量注入方式
- 推荐通过 `.env` 文件或环境变量工具（如 dotenv、cross-env）注入变量。
- 支持多环境配置文件（如 `.env.mock`、`.env.prod`），通过启动脚本或 CI/CD 自动加载。
- 变量注入后均挂载于 `process.env`，由配置适配器统一读取。

### 2. 读取与适配机制
- 所有业务层、服务层只能通过 `configService.get('KEY')` 获取配置，禁止直接读取 `process.env`。
- configService 单例导出，支持 get/set/has/remove 等方法，便于扩展和测试。
- 采用适配器模式（EnvConfigAdapter、MockConfigAdapter、RemoteConfigAdapter），可渐进切换配置源。
- 变量 key 集中声明于适配器（如 ENV_KEYS），初始化时自动批量加载。

### 3. 多环境与优先级
- 支持多环境 .env 文件，优先级为：
  1. 运行时环境变量（如 CI/CD 注入）
  2. .env.[env] 文件（如 .env.prod）
  3. .env 文件（默认开发环境）
- 变量默认值、覆盖规则可在 configService 或适配器中设定。

### 4. 业务层调用规范
- 业务代码严禁出现 `process.env.XXX`，统一用如下方式：

```ts
import { configService } from '@/core/services/infrastructure/config';
const apiUrl = configService.get('API_BASE_URL');
```

- 便于后续切换配置源、支持热更新、Mock/Remote/本地等多模式无感切换。

### 5. 典型结构与扩展
- config/index.ts：导出 configService 单例
- config/service/config-service.ts：核心服务，封装 get/set/has/remove
- config/adapters/env-config-adapter.ts：环境变量适配器，集中声明 ENV_KEYS
- config/factory/config-factory.ts：根据 CONFIG_ADAPTER 环境变量自动选择适配器

---

> 建议所有新变量、变更变量，均在本目录 README 和 docs/guides/environment-variables.md 同步补充说明。

如需扩展全局配置能力或集成远程配置、Mock 支持，请参考本目录下实现或联系架构负责人。
