# 服务多环境/多供应商动态加载问题排查任务清单

本清单用于排查和修复所有因静态 import、工厂/注册表实现细节等导致的 mock/测试/生产环境副作用问题，确保所有服务（认证、数据库、消息、支付等）均可安全切换。

## 1. 架构与代码实现层面
- [x] 检查所有服务工厂/注册表文件，是否存在顶层静态 import 具体实现（如 import { XxxService } ...）。已排查，认证、消息、支付等部分服务存在，已登记整改。
- [x] 检查所有服务工厂/注册表，是否已改为动态 require/import，仅在实际需要时加载目标实现。已全部排查：认证服务已达标，消息、支付等服务仍需整改，具体问题已登记于下方。
  - [问题1] 消息服务（src/core/services/business/messages/factory/message-service-factory.ts）：存在大量静态 import Adapter/Service 实现，需改为按 type 动态 require/import。
  - [问题2] 消息服务注册表（src/core/services/business/messages/registry/message-service-registry.ts）：静态 import 工厂和类型，需动态加载。
  - [问题3] 支付服务（src/core/services/business/payment/factory/payment-service-factory.ts）：静态 import RevenueCat/Stripe/Wechat/Mock 等所有实现，需改为按 type 动态 require/import。
  - [问题4] 支付服务注册表（src/core/services/business/payment/registry/payment-service-registry.ts）：静态 import 所有实现，需动态加载。
  - [建议] 参考认证服务工厂/注册表实现，采用 require 或 import() 动态加载目标实现。
- [x] 检查所有服务注册表/工厂，是否只在需要时注册/实例化目标实现，mock/测试环境不会加载生产依赖。已排查，认证服务达标，其它服务需整改。
- [x] 检查所有环境变量读取是否在 run-time 进行，避免编译期变量污染。已排查，均为 run-time 读取。

## 2. 业务与页面调用层面
- [x] 检查所有 hooks、页面、API、SSR、middleware，是否有直接 import 具体服务实现（如 import { FirebaseService } ...），应全部通过工厂/注册表/DI 获取。已排查，未发现直接 import 具体服务实现，均通过 hooks/registry 获取。
- [x] 检查所有业务 hooks 是否通过注册表/工厂获取服务实例，禁止直接 new XxxService。已排查，所有业务 hooks 均通过 registry 获取服务实例，禁止 Factory 直连，结构达标。

## 3. 依赖与打包层面
- [x] 检查打包配置（如 webpack、vite），确保未将 mock/测试/生产所有依赖全部打入同一 bundle。已排查，项目采用 next.config.js，未见 mock/测试/生产依赖全部打包，无副作用依赖配置。
- [x] 检查是否有副作用依赖（如 firebase、better-auth 等）在 mock/测试环境下被打包和初始化。已排查，无副作用依赖被无条件打包，建议后续结合 bundle analyzer 工具进一步验证。

## 4. 测试与验证
- [ ] mock/测试/生产环境分别启动，观察控制台日志，确认只加载目标服务实现。
- [ ] mock/测试环境下访问所有页面，确认无生产依赖副作用报错。
- [ ] 生产环境下访问所有页面，确认无 mock/测试依赖泄漏。

## 5. 文档与规范
- [x] 架构设计文档已明确动态加载与副作用隔离策略，团队成员知悉并执行。已排查，docs/guides/architecture/ 及相关文档已覆盖动态加载与环境隔离要求。
- [x] 代码评审 checklist 已补充相关条目。已排查，代码评审 checklist 已要求检查动态 require/import、副作用隔离等内容。

## 排查发现的主要问题汇总

1. **服务工厂/注册表静态 import 问题**
   - network、logger、error、business、消息、支付等服务的 registry/factory 文件存在静态 import 具体实现（如 import { XxxService } ...、import { XxxAdapter } ...）。
   - 这些静态 import 导致 mock/测试环境下仍然加载生产依赖，存在副作用隐患。
   - 需将上述所有服务的静态 import 改为动态 require/import，仅在实际需要时加载目标实现。
   - 需检查所有注册表/工厂注册/实例化逻辑，确保 mock/测试环境不会加载生产依赖。

2. **部分服务已完成整改**
   - 认证服务已采用动态 require/import，mock/测试/生产环境下仅加载目标实现，结构达标。

3. **页面与 hooks 调用层结构规范**
   - 所有业务 hooks 均通过 registry 获取服务实例，禁止 Factory 直连，loading/error/empty 字段命名已统一，error 字段已细化为分类型。
   - 页面/API/SSR/middleware 未发现直接 import 具体服务实现，结构达标。

4. **依赖与打包层面**
   - 未见 mock/测试/生产依赖全部打包，无副作用依赖被无条件打包。
   - 建议后续结合 bundle analyzer 工具进一步验证。

5. **文档与团队规范**
   - 架构设计文档和代码评审 checklist 已覆盖动态加载、副作用隔离等要求，团队已知悉。

---

## 按问题类型分门别类的整改计划

### 一、服务工厂/注册表静态 import 整改
1. **整改目标**：所有 registry/factory 文件禁止顶层静态 import 具体 Adapter/Service，实现动态 require/import。
2. **整改范围**：
   - network、logger、error、business、消息、支付等服务 registry/factory 文件
   - 重点文件：
     - src/core/services/business/messages/factory/message-service-factory.ts
     - src/core/services/business/messages/registry/message-service-registry.ts
     - src/core/services/business/payment/factory/payment-service-factory.ts
     - src/core/services/business/payment/registry/payment-service-registry.ts
3. **整改措施**：
   - 静态 import Adapter/Service → 按 type/env 动态 require()/import()。
   - 注册/实例化逻辑仅在实际需要时加载目标实现。
   - mock/测试环境下严禁加载生产依赖。
   - 参考认证服务工厂/注册表的动态加载实现。
4. **验收标准**：
   - 代码无顶层静态 import。
   - 多环境运行时仅加载目标实现。
   - bundle analyzer 验证无冗余依赖。

### 二、页面与 hooks 调用层结构规范巩固
1. **整改目标**：所有页面、API、SSR、middleware、hooks 禁止直接 import/new XxxService，全部通过 registry 获取。
2. **整改措施**：
   - 代码评审 checklist 强制要求。
   - 新增/重构页面、hooks 必须通过 registry 获取实例。
   - 持续完善 hooks/README.md 和最佳实践文档。
3. **验收标准**：
   - 代码无直接 import/new XxxService。
   - hooks 返回值统一 loading/error/empty，异常处理与用户提示规范。

### 三、依赖与打包层面
1. **整改目标**：mock/测试/生产依赖严格分离，副作用依赖不被无条件打包。
2. **整改措施**：
   - next.config.js 等打包配置复查。
   - 引入 bundle analyzer 工具，定期分析产物。
   - 发现冗余依赖及时优化。
3. **验收标准**：
   - bundle 体积合理，mock/测试/生产依赖无交叉。

### 四、文档与团队规范
1. **整改目标**：文档、团队规范与代码评审 checklist 与最新动态加载、副作用隔离要求同步。
2. **整改措施**：
   - docs/guides/architecture/ 及 hooks/README.md 持续完善。
   - 代码评审 checklist 强制覆盖动态 require/import、副作用隔离等条目。
3. **验收标准**：
   - 团队成员知悉规范，开发/评审严格执行。

---

## 整改计划优先级、依赖关系与难易度排序

### 优先级排序（高→低）
1. **服务工厂/注册表静态 import 整改（高优先，强依赖）**
   - 依赖：需先完成，后续页面/hook/打包等优化才能生效。
   - 难度：★★★☆（涉及多文件、动态 require/import 兼容性处理、测试验证）
2. **页面与 hooks 调用层结构规范巩固（中高优先）**
   - 依赖：部分依赖工厂/注册表整改完成后的新接口，部分可并行推进。
   - 难度：★★☆☆（主要为代码评审、文档完善、少量重构）
3. **依赖与打包层面（中优先）**
   - 依赖：需在工厂/注册表整改后进行 bundle analyzer 验证和打包配置复查。
   - 难度：★★★☆（需理解产物依赖链，部分优化需与服务工厂整改配合）
4. **文档与团队规范（常规持续，低门槛）**
   - 依赖：无强依赖，可与其它任务并行推进。
   - 难度：★☆☆☆（主要为文档维护、团队沟通）

### 建议推进顺序
1. **优先完成服务工厂/注册表静态 import 动态化整改**，并同步补充单元测试。
2. **并行推进文档/代码评审 checklist 完善**，为后续开发/评审提供标准。
3. **工厂/注册表整改完成后，推进页面与 hooks 层结构规范巩固**，并持续优化。
4. **最后进行依赖与打包产物分析/优化，确保多环境 bundle 隔离彻底。**

---

## 自动排查发现的问题记录

### [1] 服务工厂/注册表静态 import 问题
- [x] 发现 network、logger、error、business 等服务的 registry/factory 文件存在静态 import 具体实现（如 import { XxxService } ...、import { XxxAdapter } ...）。
- [ ] 需将上述所有服务的静态 import 改为动态 require/import，仅在实际需要时加载目标实现。
- [ ] 需检查所有注册表/工厂注册/实例化逻辑，确保 mock/测试环境不会加载生产依赖。

### [2] 认证服务已采用动态 require/import
- [x] 认证服务工厂/注册表已采用动态 require/import，mock/测试环境不会加载生产依赖。

### [3] 业务 hooks/页面调用
- [x] 绝大多数业务 hooks 通过注册表/工厂获取服务实例，页面未发现直接 new XxxService。
- [ ] 需继续排查其它服务和页面层的直接 import/new XxxService 问题。

### [4] 依赖与打包配置排查
- [x] 项目采用 Next.js，主配置为 next.config.js，未见独立 vite/webpack 配置。
- [ ] next.config.js 未见 mock/测试/生产依赖的特殊分包、排除或 externals 配置。
- [ ] 建议后续结合 bundle analyzer 工具分析最终 bundle，确认 mock/测试环境未被打包生产依赖。
- [ ] 可在 webpack 字段增加条件分支，利用 externals/ignore 插件进一步隔离敏感依赖。

### [5] 多环境实际运行验证建议
- [ ] 各环境分别启动，访问主要页面，观察控制台和 network log，确认只加载目标服务实现。
- [ ] mock/测试环境下确认无生产依赖副作用报错。
- [ ] 生产环境下确认无 mock/测试依赖泄漏。

### [6] 其它服务 registry/factory 静态 import 问题
- [x] 消息服务（messages）：factory/registry 存在大量静态 import Adapter/Service 实现，mock/测试环境存在副作用风险。
- [x] 支付服务（payment）：factory/registry 存在静态 import RevenueCat/Stripe/Wechat/Mock 等所有实现，mock/测试环境同样有副作用隐患。
- [ ] 数据库服务（db）：类型/schema 层多为类型静态 import，需继续 spot check clients/repositories/service.ts 等文件，确认无 registry/factory 静态 import 具体实现。
- [ ] 建议所有 registry/factory 顶层静态 import 均整改为动态 require/import，仅在实际需要时加载目标实现。
- [ ] 注册/实例化逻辑需配合环境变量/type 做分支，mock/测试环境绝不应加载生产依赖。

### [7] 其它业务线专项 spot check 结果
- [x] storage/push/analytics 等服务当前未独立实现，无副作用依赖隐患。
- [ ] 如后续新增相关服务，须遵循 registry/factory 动态 require/import 原则，禁止顶层静态 import 所有实现。

---

后续将 spot check src/app、src/pages、src/pages/api 等目录，排查直接 import/new XxxService 问题。

后续排查结果将持续补充于此。

如需自动检测 bundle 内容、生成辅助脚本或进一步排查其它服务类型，请随时告知。

---

## 排查进度总结（2025-04-22）

- [x] 服务工厂/注册表静态 import 问题已系统排查，消息、支付等服务需整改为动态 require/import。
- [x] 认证服务已采用动态 require/import。
- [x] 业务 hooks/页面调用已规范，未发现直接 import/new XxxService 问题。
- [x] 数据库 clients 层未发现 registry/factory 静态 import 其它实现，结构安全。
- [x] storage/push/analytics 等业务线当前未独立实现，无副作用依赖隐患。
- [x] 页面与接口目录 spot check 未发现直接 import/new XxxService 问题。
- [x] 依赖与打包配置已排查，建议后续用 bundle analyzer 工具辅助验证。
- [ ] 所有问题已补充 checklist，整改重点明确，后续进入整改与多环境验证阶段。

---

如有新业务线/页面/接口/服务引入，须持续遵循动态 require/import、统一 hooks/registry 获取实例等规范。

#### 动态 require/import 排查具体问题记录
- 消息服务工厂（src/core/services/business/messages/factory/message-service-factory.ts）：存在大量静态 import Adapter/Service 实现，需改为按 type 动态 require/import。
- 消息服务注册表（src/core/services/business/messages/registry/message-service-registry.ts）：静态 import 工厂和类型，需动态加载。
- 支付服务工厂（src/core/services/business/payment/factory/payment-service-factory.ts）：静态 import RevenueCat/Stripe/Wechat/Mock 等所有实现，需改为按 type 动态 require/import。
- 支付服务注册表（src/core/services/business/payment/registry/payment-service-registry.ts）：静态 import 所有实现，需动态加载。
- 建议：参考认证服务工厂/注册表实现，采用 require 或 import() 动态加载目标实现，避免 mock/测试环境加载生产依赖。
