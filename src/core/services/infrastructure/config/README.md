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

## 二、不建议放入全局配置的内容（详细说明）

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

## 三、最佳实践

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

## 四、参考用法

- 获取全局配置：
  ```ts
  import { useConfig } from '@/core/hooks/useConfig';
  const config = useConfig();
  ```
- 定义和扩展全局配置字段请统一在 ConfigService 及类型文件内维护。

---

## 五、Translation（多语言内容）集成说明

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
如需扩展全局配置能力或集成远程配置、Mock 支持，请参考本目录下实现或联系架构负责人。
