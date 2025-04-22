# Quiz 业务模块说明

## 目录结构

```
quiz/
├── adapters/               # Quiz 适配器实现（mock、remote、db、hybrid 等）
├── quiz-ai-adapters/       # AI 相关适配器实现（mock/hybrid/remote）
├── quiz-report-adapters/   # 测评报告适配器实现（mock/hybrid/remote）
├── factory/                # 工厂模式，统一实例化 service/adapter
├── registry/               # 插件式注册表，支持动态注册/扩展
├── service/                # 业务服务层（QuizService、QuizAIService、QuizReportService 等）
├── types/                  # 类型定义（统一聚合所有接口类型）
└── readme.md               # 本说明文件
```

## 类型定义规范
- **所有 Quiz 相关接口类型（IQuizAdapter、IQuizAiAdapter、IQuizReportAdapter、IQuizService 等）已统一聚合至 `types/quiz-service.ts` 文件**。
- 适配器实现、服务实现、工厂等均须直接引用 `../types/quiz-service` 中的接口类型，禁止本地重复定义。
- 便于类型一致性、维护和 IDE 智能提示。

## 适配器实现规范
- `adapters/` 目录下所有实现（如 MockQuizAdapter/RemoteQuizAdapter/HybridQuizAdapter/DbQuizAdapter）均需实现 `IQuizAdapter`。
- AI 相关适配器、测评报告适配器同理，分别实现 `IQuizAiAdapter`、`IQuizReportAdapter`，并统一从 types 引用。
- adapter 层仅关注底层实现，service 层负责聚合与业务逻辑。

## 工厂、注册表与服务层
- 所有 service 层实例化、adapter 聚合均通过 factory 目录下工厂方法实现，支持 mock/remote/hybrid/自动降级等。
- 注册表（registry）支持插件式动态注册/扩展 adapter。
- service 层仅引用 types/quiz-service.ts 中的接口类型。

## 近期重构说明
- 已移除 `adapters/quiz-adapter.ts`、`quiz-ai-adapters/ai-adapter.ts`、`quiz-report-adapters/report-adapter.ts` 等冗余接口文件。
- 所有实现已统一引用 `types/quiz-service.ts`，彻底消除类型重复与歧义。
- 工厂方法全部支持插件式注册、mock/remote/hybrid/brandX 等多类型自动降级。
- hooks 层全部通过工厂方法获取 service/adapter 实例，禁止直接 new 或 ServiceRegistry。

## 典型用法
```ts
import { QuizServiceFactory } from '@/core/services/business/quiz/factory/quiz-service-factory';
import { useQuizAiAdapter } from '@/core/hooks/useQuizAiAdapter';

// 获取 QuizService（自动降级，支持 mock/remote/hybrid）
const quizService = QuizServiceFactory.createService('remote', process.env.NEXT_PUBLIC_API_URL);

// 在 hooks 中获取 AI 适配器
const aiAdapter = useQuizAiAdapter('default', process.env.NEXT_PUBLIC_API_URL);
```

## 插件化注册表与工厂函数模式在 Quiz 业务的具体应用

为适应命理、MBTI、AI测评等多类型 Quiz 需求，Quiz 模块全面采用“注册表+工厂函数”插件化架构：

- **多类型适配**：每种 quiz 类型（如 mbti、fortune、ai、db 等）都实现独立的 `IQuizAdapter` 子类（如 MbtiQuizAdapter、FortuneQuizAdapter、DbQuizAdapter、MockQuizAdapter 等）。
- **插件式注册**：所有适配器通过 `QuizServiceFactory.registerAdapter(type, factory)` 注册，支持运行时动态扩展、A/B 测试、品牌定制等。
- **统一实例获取**：业务层、hooks 层、页面组件统一通过 `QuizServiceFactory.createService({ type, options })` 获取服务实例，严禁直接 new 或手动切换。
- **自动降级与Mock**：支持根据环境、配置自动降级为 mock/remote/ai/定制类型。
- **扩展示例**：如需新增“星座测评”类型，仅需实现 ConstellationQuizAdapter 并注册即可，无需改动主流程。

### 典型用法示例
```ts
// 注册自定义适配器（如品牌/AI/新题型）
QuizServiceFactory.registerAdapter('constellation', () => new ConstellationQuizAdapter());

// 获取指定类型的 QuizService 实例
const quizService = QuizServiceFactory.createService({ type: 'mbti' });

// 在 hooks 层统一获取
const { quizzes, loading, error } = useQuiz({ type: 'fortune' });
```

### 最佳实践
- 所有 quiz 相关实现、扩展、测试均应通过插件化注册表完成，禁止硬编码类型。
- hooks 层、service 层、页面层调用方式完全解耦，便于维护、扩展和测试。
- 支持多类型、多供应商、多算法并存，满足复杂测评业务需求。

如需批量注册/扩展新 quiz 类型，请参考 factory/quiz-service-factory.ts 及本说明。

## 服务注册表 getProvider 统一规范

所有 Registry 的 `getProvider` 方法应采用如下统一签名：

```typescript
getProvider(
  type: string,         // mock/remote/hybrid/brandA/brandB 等服务类型
  name?: string,        // 实例名，默认 'default'
  dataService?: any,    // 可选，部分服务如 Match 需注入数据服务
  options?: object      // 其它扩展参数，预留
): () => IService
```

- 推荐统一调用体验，便于 hooks 泛型化和批量重构。
- 详见[服务架构统一规范](../../../../docs/guides/architecture/services/overview.md)。

## hooks 规范
- 业务 hooks（如 useQuiz/useQuizAiAdapter/useQuizReportAdapter）全部通过工厂方法获取实例。
- 返回值统一包含 loading/error/empty，异常处理与用户提示友好。
- 禁止直接调用 ServiceFactory/Service，禁止 hooks 内部手动 new。
- 支持 mock/remote 自动降级，apiBaseUrl 环境变量自动注入。

## 维护建议
- 新增/修改接口类型请统一在 `types/quiz-service.ts` 维护。
- adapter/service/工厂/registry 实现均引用统一类型，禁止本地重复定义。
- 如需批量迁移其它业务类型（如 user/message/notification），可参考本目录聚合模式。