# 测试计划

## 一、总体目标
- 保持整体覆盖率 ≥90%，各核心模块 ≥85%
- 单元、集成、端到端（E2E）全链路覆盖
- 重点关注核心业务逻辑、数据一致性、服务适配器与移动端特性
- 自动化测试与手动测试结合，保障主流程与边界场景

---

## 二、测试类型与分工及优先级

### 1. 单元测试（Unit Testing）
- **优先级说明**：
  1. **core/hooks**（最高优先，依赖服务、utils、store，直接影响页面/业务流）
  2. **core/services**（高优先，业务逻辑集中，hooks 依赖）
  3. **core/utils**（高优先，所有模块基础依赖）
  4. **db/types**（高优先，类型安全保障，服务/仓储/页面依赖）
  5. **core/lib**（中优先，schema/表结构/注册表，服务与仓储依赖）
  6. **core/store**（中优先，状态管理，hooks/页面依赖）
  7. **core/components**（中优先，页面依赖，单测易于补充）
- **工具**：Jest + React Testing Library、ts-jest、Vitest（已落地）
- **要求**：所有业务 hooks、服务适配器、工具函数必须有单元测试，覆盖主分支与异常分支
- **进展**：
  - 已完成 core/utils 模块 smoke test（@ 路径别名、index.ts、实际导出均已验证通过，测试 runner 能正确识别 alias）。
  - core/lib、components、services 等模块结构已规范，部分 index.ts 已补齐，后续将继续补充实际导出与测试。
  - 路径别名 alias 体系已在 vitest.config.ts 和 tsconfig.json 完全统一，测试环境可用。
  - [x] useMatches hook 路径和类型问题已彻底修复，测试已恢复可用（静态 import 放到顶部解决 alias/require 兼容性问题）。
  - [ ] useMatches 相关 act() 警告待优化，当前不影响主流程。
  - [ ] 其它 hooks/service 路径和测试覆盖率持续推进中。
- **负责人**：各模块负责人

#### 单元测试细化任务（按优先级排序）
1. core/hooks
   - [ ] （测试用例文件未创建）useUser/useMessages/useQuiz/useAuth/useApi/useToast/useAsyncAction 等 hooks 需新建 smoke test/主流程单测文件，并确认落地
   - [ ] 已有 useAiImageTaskQueue 用户流程测试（仅自定义 hook，主业务 hooks 未覆盖）
   - [ ] hooks 组合与扩展场景
   - [ ] mock 环境降级与异常提示
2. core/services
   - [ ] 各 Service 的主流程、异常流程
   - [ ] ServiceFactory 注入、mock 服务降级
   - [ ] 依赖 hooks 的服务联动测试
3. core/utils
   - [ ] 所有工具函数的主分支与异常输入
   - [ ] index.ts 导出一致性
4. db/types
   - [ ] 各类型接口的结构、约束、默认值、边界场景
5. core/lib
   - [ ] db/schema 注册与表结构工具
   - [ ] 版本管理、schemaRegistry 单例
   - [ ] TableConverter、数据库类型工厂
6. core/store
   - [ ] 全局状态管理逻辑
   - [ ] 状态变更、订阅、重置等场景
7. core/components
   - [ ] 每个 UI 组件的渲染、props 校验、交互事件
   - [ ] 业务组件的状态管理、边界场景
   - [ ] 复合组件的组合与拆分测试

---

### 2. 集成测试（Integration Testing）
- **优先级说明**：
  1. **API 路由**（最高优先，前后端主流程依赖）
  2. **服务层组合逻辑**（高优先，业务链路完整性）
  3. **数据库读写**（高优先，数据一致性保障）
  4. **数据同步与降级**（中优先，离线/在线切换、mock 场景）
- **工具**：Jest + supertest、自定义 mock/fake 数据库
- **要求**：关键 API、数据同步、mock/测试环境自动降级需覆盖
- **负责人**：后端/服务负责人

#### 集成测试细化任务（按优先级排序）
1. API 路由
   - [ ] 关键业务 API（如注册、登录、消息、匹配、同步等）全分支测试
   - [ ] 权限校验、异常响应
2. 服务层组合逻辑
   - [ ] 复杂业务流程（如注册->匹配->消息通知全链路）
   - [ ] mock/fake 数据库环境下的行为一致性
3. 数据库读写
   - [ ] 各表的增删查改集成测试
   - [ ] 事务、回滚、并发场景
4. 数据同步与降级
   - [ ] 离线/在线切换、同步冲突、数据一致性
   - [ ] mock/测试环境自动降级

---

### 3. 端到端测试（E2E Testing）
- **优先级说明**：
  1. **主用户流程**（最高优先，注册、登录、匹配、消息、设置等）
  2. **离线/弱网/断网场景**（高优先，PWA/移动端核心体验）
  3. **移动端原生能力**（高优先，推送、存储、iOS/Android 兼容）
  4. **数据同步/极端异常**（中优先，大量数据、批量同步等）
- **工具**：Playwright/Cypress、Appium/Capacitor 官方插件
- **要求**：主用户流程、离线/同步/异常场景全链路测试
- **负责人**：QA/自动化测试工程师

#### E2E 测试细化任务（按优先级排序）
1. Web/PWA 主流程
   - [ ] 注册、登录、资料完善、匹配、消息、设置等主流程
2. 离线/弱网/断网场景
   - [ ] 离线/弱网/断网下的主流程、数据恢复
3. 移动端/Capacitor
   - [ ] 移动端适配、原生能力调用（如推送、存储）
   - [ ] iOS/Android 兼容性
4. 数据同步/异常
   - [ ] 离线数据操作、恢复后同步
   - [ ] 大量数据、极端场景（如批量消息、批量同步）

---

## 测试文件引用规范

### 推荐方式：@/ 绝对路径

- 测试文件（包括 hooks、service、utils 等）应优先使用 `@/` 绝对路径进行模块导入。
- 例如：
  ```ts
  import { AuthEventManager } from '@/core/services/business/auth/factory/auth-events';
  import { useAuth } from '@/core/hooks/useAuth';
  ```
- 这样可避免因相对路径变更导致的维护困难与易错问题。
- 项目已配置 `@/` 别名，支持在 TypeScript、Jest/Vitest 等环境下直接引用。

### 不推荐：相对路径

- 不建议如下写法：
  ```ts
  import { useAuth } from '../useAuth';
  import { AuthEventManager } from '../factory/auth-events';
  ```
- 相对路径在目录结构调整时极易出错，且可读性较差。

### 说明
- 如遇 IDE/测试环境无法识别 `@/` 路径，请检查 `tsconfig.json`、`vitest.config.ts` 等配置文件的 path alias 设置。
- 统一采用绝对路径有助于提升代码一致性和团队协作效率。

---

## 三、src 目录测试任务细化（按依赖/优先级排序）
1. src/core/hooks
2. src/core/services
3. src/core/utils
4. src/db/types
5. src/core/lib
6. src/core/store
7. src/core/components

---

## 四、app 目录测试任务细化（按依赖/优先级排序）
1. app/page.tsx & app/layout.tsx（全局入口，Provider/样式/错误边界）
2. app/mobile/
   - auth（登录/注册/三方登录/验证码）
   - matches（匹配主流程）
   - profile（资料编辑/保存/图片上传）
   - chat（消息收发/历史消息）
   - settings（设置项、通知、重置）
   - 其它业务页面（quiz、onboard、member-center、subscribe、discover、home等）
3. app/(web)/dashboard（web 端主流程）
4. app/api（API 路由、mock、权限）

---

## 五、自动化与文档
- [ ] 所有测试任务与进度同步到 test-plan.md
- [ ] 每次 PR/合并前自动运行单元、集成、E2E 测试
- [ ] 失败用例自动报警、分配责任人

---

## 六、测试用例文件创建与确认机制
- [ ] 每个核心 hooks、service、utils、组件、API 必须有对应的测试用例文件（如 `useUser.test.ts`, `UserService.test.ts` 等），无文件时需在进度表中标明并优先补齐。
- [ ] 新建测试文件需在 test-plan.md 记录，待评审后勾选“已创建”。
- [ ] 每次测试推进前，先全量扫描目标目录，自动检测缺失的测试用例文件并输出清单。
- [ ] 评审和合并时，需确认所有主流程/核心分支均有测试用例文件覆盖。
- [ ] 如需为某一模块批量生成 smoke test 或单元测试模板，可由工具批量生成并同步到进度表。

> 如需为某一模块批量生成 smoke test 或单元测试模板，请补充说明目标目录或页面。

### 2025-04-19 进度更新

- [x] 所有 src/core/hooks/__tests__ 目录下 smoke 测试均已通过（useQuiz.smoke.test.ts 路径修正后通过）。
- [x] hooks 相关工厂方法调用全部修正为实际存在的静态方法（如 QuizServiceFactory.createService）。
- [x] 所有测试文件已统一采用 @/ 绝对路径导入项目源码，三方包用包名导入。
- [x] 测试引用规范已补充进本文件。
- [ ] 下一步可推进 src/core/services 层和更复杂业务 hooks 的单元/集成测试。

### 2025-04-19 服务层测试进度

- [x] 已为 QuizService、AuthService、UserService、MessageService、MatchService、ImageService 等核心服务主方法补充单元测试，覆盖正常流程、异常分支、mock 场景。
- [x] 这些服务的 smoke test 均可正常运行，服务实例可创建、核心方法可调用。
- [x] 已为 NotificationService、PaymentService、AI 相关 Service 补充 smoke test，并验证主流程。
- [ ] 下一步：推进 src/core/services 层核心服务（如 UserService、NotificationService、PaymentService、AI 相关 Service）更细粒度的单元测试和集成测试，重点覆盖异常分支、依赖注入、mock 场景、边界条件等。

### 2025-04-19 单元/集成测试推进计划

- [x] 已为 UserService、NotificationService、PaymentService、AI Task Service、MatchService、QuizService、ImageService 等核心服务主方法补充单元测试，覆盖正常流程、异常分支、mock 场景。
- [x] 已为 useUser、useAuth、useMessages 等 hooks 补充复杂场景单元测试，覆盖主流程、异常、边界。
- [ ] 部分测试存在失败（如 useUser/useAuth/useMessages 复杂场景 eventManager mock、UserService adapter 数据未初始化等），需进一步修正 mock 逻辑和测试用例。
- [ ] 下一步：持续修复失败测试、完善 eventManager/Registry/mock 初始化，推进其它 hooks/service 集成测试。

---

#### 本轮自动化测试结果简要
- 通过：NotificationService、PaymentService、AI Task Service、部分 hooks 正常流程
- 失败：UserService（create/update 边界）、useUser/useAuth/useMessages（eventManager 未 mock）、部分 hooks 边界/异常分支

---

> 已同步最新测试推进进度及问题，建议优先修复 mock/依赖注入相关失败用例。

### 2025-04-19 hooks 规范与一致性整改进展

- [x] 所有业务 hooks 均通过 Registry 获取服务实例，禁止 Factory 直连。
- [x] loading/error/empty 字段命名已统一，error 字段已细化为分类型。
- [x] hooks/README.md 和测试用例已同步完善。
- [x] Mock/测试环境下 hooks 自动降级到 mock service。
- [ ] 后续新 hooks 必须严格遵循此规范，测试推进时持续抽查。
