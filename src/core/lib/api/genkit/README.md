# Genkit AI 服务业务集成与封装说明

本文件说明如何将 Genkit 框架下的多模型能力（如 Google VertexAI、Gemini、OpenAI、Anthropic 等）进一步封装为团队统一的业务服务，纳入现有 Adapter/Registry/Service/Hook 体系，便于前后端和测试环境灵活调用。

---

## 1. 目标与背景

- 统一业务层 AI 服务调用方式，兼容 mock、本地、远程、Genkit 多通道。
- 支持通过 Genkit flows/actions 直接调用主流大模型，提升扩展性与维护性。
- 保持与现有 Adapter/Registry/Service/Hook 规范兼容。

---

## 2. 封装方案

### a) 新增 GenkitAIAdapter

- 位置：`src/core/services/business/quiz/quiz-ai-adapters/genkit-ai-adapter.ts`
- 主要职责：通过 Genkit 客户端 SDK（如 `@genkit-ai/nextjs/client`）发起 flow 调用，统一返回 AIModelResponse 结构。
- 示例代码：

```typescript
import { runFlow } from '@genkit-ai/nextjs/client';
import type { IAIAdapter } from './ai-adapter';
import type { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

export class GenkitAIAdapter implements IAIAdapter {
  async analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model: string = 'gemini15Flash',
    extraPrompt?: string
  ) {
    const prompt = /* 构造 prompt，复用现有 buildPrompt */;
    const result = await runFlow({
      url: '/api/genkit/quizFlow', // 你的 Genkit flow API 路由
      input: { prompt, model },
    });
    return {
      result: result.text || result.media || '',
      raw: result,
    };
  }
}
```

### b) 注册进 AI Adapter Registry

- 在 `ai-adapter-registry.ts` 中注册 `genkit` 类型适配器。
- 支持通过环境变量切换默认 Adapter 类型（如 mock/genkit/hybrid）。

### c) 业务服务层调用

- 业务服务（如 QuizAIService）通过 Registry 自动获取 GenkitAIAdapter 实例。
- hooks 层透明切换，无需关心底层模型实现。

---

## 3. 自动降级与多通道支持

- 支持 mock/hybrid/genkit/自建 API 多通道灵活切换，兼容团队自动降级和测试规范。
- 推荐通过环境变量（如 `NEXT_PUBLIC_AI_ADAPTER_TYPE`）动态切换。

---

## 4. 测试与最佳实践

- 建议补充 hooks 层和单元测试用例，确保全链路可用。
- 保持 Adapter/Registry/Service/Hook 层级解耦，便于后续扩展。

---

## 5. 参考链接

- [Genkit 官方文档](https://github.com/firebase/genkit)
- [Vertex AI 插件文档](https://firebase.google.com/docs/genkit/plugins/vertex-ai?hl=zh-cn&authuser=0)
- [Next.js 插件用法](./nextjs-plugin.md)

---

如需具体代码实现、注册流程或业务集成示例，请联系架构负责人或参考本目录下的示例代码。
