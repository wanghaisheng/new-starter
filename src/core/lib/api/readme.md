# AI 通道与第三方 API 封装设计

本目录用于统一封装各类 AI 能力相关的第三方 API（如 OpenAI、Deepseek、OpenRouter、Genkit、Vercel AI SDK、自建代理等），为业务层和 Adapter 层提供“供应商无关”的聚合与切换能力。

---

## 1. 设计目标

- 支持多供应商、多模态（文本/图片/音频/视频/音乐等）AI 能力的统一调用。
- 聚合官方 API（如 openai、deepseek）、代理通道（如 openrouter）、框架（如 genkit、vercel-ai-sdk）及自建 API。
- 通过统一接口（AIChannel）屏蔽底层差异，便于业务层/Adapter/Hook 透明切换。
- 支持通道注册、优先级、fallback、mock、本地/远程降级等策略。

---

## 2. 推荐目录结构与封装方式

建议将本目录结构化为“通道聚合+标准化接口”的分层模式，每个供应商/通道独立封装，便于维护与扩展：

```
src/core/lib/api/
├── openai.ts           # OpenAI 官方 API 封装
├── openai.md           # OpenAI 接入说明
├── deepseek.ts         # Deepseek 官方 API 封装
├── deepseek.md         # Deepseek 接入说明
├── openrouter.ts       # OpenRouter 聚合代理通道
├── openrouter.md       # OpenRouter 用法说明
├── genkit/             # Genkit flows/actions 封装与文档
│   ├── google.ts
│   ├── vertex-ai.md
│   ├── README.md
│   └── ...
├── vercel-ai-sdk/      # Vercel AI SDK 封装与文档
│   ├── index.ts
│   ├── README.md
│   └── ...
├── custom-proxy.ts     # 自建 API 代理通道
├── ai-channel.ts       # 统一 AIChannel 接口定义
├── ai-channel-registry.ts # 通道注册/切换/优先级/fallback
├── types.ts            # 通用 AIOptions/AIResult 类型定义
├── readme.md           # 设计说明与能力矩阵
└── ...                 # 其它供应商/新通道可随时扩展
```

- 每个供应商/通道单独封装（如 openai.ts、deepseek.ts、openrouter.ts、genkit/、vercel-ai-sdk/），便于独立维护和升级。
- 所有通道实现统一的 AIChannel 接口，支持多模态能力（文本/图片/视频/音频/音乐等）。
- 通过 ai-channel-registry.ts 实现通道注册、优先级、fallback、mock、本地/远程等策略。
- 类型、参数、异常等通过 types.ts 标准化。
- 每个通道都应有 md 文档说明用法、参数、异常处理、测试建议。
- 新增供应商/模型/模态时，只需新增一个 ts 封装和注册即可，无需动业务层代码。

---

## 3. 统一 AI 通道接口抽象

```typescript
export interface AIChannel {
  generateText(prompt: string, options?: AIOptions): Promise<AIResult>;
  generateImage(prompt: string, options?: AIOptions): Promise<AIResult>;
  // ...更多模态
}
```

- 每个供应商/通道实现自己的 AIChannel
- 通过 AIChannelRegistry 支持注册、切换、优先级、fallback

---

## 4. 通道注册与切换机制

```typescript
export class AIChannelRegistry {
  private static channels: Record<string, AIChannel> = {};
  static registerChannel(name: string, channel: AIChannel) { ... }
  static getChannel(name: string): AIChannel { ... }
}
```
- 支持通过环境变量、配置、业务参数动态选择通道
- 业务 Adapter/Service/Hook 只依赖统一接口，无需关心底层供应商

---

## 5. 业务调用链路示例

1. 业务层（如 QuizAIService）通过 Registry 获取 AI Adapter
2. Adapter 通过 Registry/Factory 获取指定 AIChannel
3. AIChannel 统一封装各类通道（官方、openrouter、genkit、vercel-ai-sdk、自建等），自动路由、异常处理、fallback
4. lib/api/ 负责所有底层 SDK/HTTP 封装、参数标准化、异常转换

---

## 6. 典型场景

- 配置 `vendor=deepseek`，走 deepseek 官方 API
- 配置 `vendor=openrouter`，走 OpenRouter 统一代理
- 配置 `vendor=genkit`，走 genkit flows
- 配置 `vendor=vercel-ai-sdk`，走 vercel-ai-sdk
- 业务层/Hook 层透明切换

---

## 7. 扩展性与最佳实践

- 支持任意新增供应商和模态，无需重构业务代码
- 推荐每个通道单独封装，接口对齐，便于维护
- 支持 mock、本地/远程、流式/非流式等多种降级和测试策略

---

## 8. 业务服务如何与 lib/api 整合

业务服务（如 QuizAIService、MessageAIService、ImageAIService 等）通过 Adapter/Registry 机制与 lib/api 层的多通道能力无缝集成，实现如下：

1. **统一依赖 AIChannel 接口**：业务服务层不直接依赖具体供应商/SDK，仅依赖 AIChannel 统一接口。
2. **通过 Adapter/Registry 获取通道**：业务服务通过 AIAdapter 或 Registry 获取所需的 AIChannel（如 genkit、vercel-ai-sdk、openai、deepseek、openrouter、自建等）。
3. **灵活切换与降级**：支持通过环境变量、配置或业务参数动态切换底层通道，实现主用/备用/fallback/mock 等多策略。
4. **多模态支持**：业务服务可按需调用 generateText、generateImage、generateAudio、generateVideo 等多模态方法，底层由 lib/api 层自动路由到对应供应商。
5. **异常与结果统一处理**：lib/api 层负责所有底层异常捕获、结果标准化，业务服务层只需处理统一的 AIResult。

### 示例调用链路

```typescript
// 业务服务层
import { AIChannelRegistry } from '@/core/lib/api/ai-channel-registry';

const aiChannel = AIChannelRegistry.getChannel(process.env.AI_VENDOR || 'genkit');
const result = await aiChannel.generateText('请生成一段分析报告', { model: 'gemini' });

// 业务 Adapter 层可进一步封装为更高阶业务方法
```

### 典型业务整合模式
- QuizAIService：自动选择最佳 AI 通道分析测评答案，支持降级到 mock 或备用供应商
- MessageAIService：调用多通道文本生成，兼容流式输出
- ImageAIService：多供应商文生图能力，支持 fallback
- **命理分析服务**：提交用户出生日期、时辰、城市等信息，调用 AI 通道获取八字命理分析报告，支持多模型/多供应商灵活切换
- **语音消息安全过滤**：上传语音消息后，调用第三方 AI 进行语音转文本及安全词过滤，确保内容合规安全
- **心情日记壁纸生成**：用户提交心情日记文本，自动调用文本生成图片/壁纸的 AI 服务，生成精美个性化壁纸，支持多模型/多供应商
- 其它业务服务：均可通过统一接口和注册机制，方便扩展和维护

---

如需具体业务服务整合代码模板、最佳实践或测试用例，请参考各业务目录下实现或联系架构负责人。

调用其他诸如vercel ai sdk

调用的第三方api的封装

比如ai  文生图  文生视频等等api

---

## 9. 能力矩阵与功能/模型映射

本项目聚合了丰富的 AI 能力，涵盖视频、图片、音频、文本等多模态生成与增强，支持多家主流模型/供应商，具体映射如下：

### 9.1 功能维度（Tools/Use Cases）
- **视频工具**：AI 视频生成、图生视频、视频转视频、角色一致视频、视频增强、视频延长、运动蒙版等
- **图片工具**：AI 艺术生成、背景移除、物体移除、图片增强、风格化生成、动漫超分等
- **其它工具**：音频生成、文本生成等（可扩展）

### 9.2 模型/供应商维度（Models/Providers）
- **视频模型**：Kling AI、Runway、Hailuo AI、Vidu AI、Luma AI、PixVerse、Veo、Hunyuan、Wanx AI、Seaweed 等
- **图片模型**：Recraft、Ideogram、Stable Diffusion、FLUX、Dall-E、Imagen 等
- **其它模型**：可扩展（如音频/文本/多模态）

### 9.3 能力矩阵设计原则
- 每一类“AI 工具/功能”均有对应的业务服务（如 VideoGenerationService、ImageEnhanceService），对外暴露统一接口（如 generateVideo、generateImage）
- 每个服务内部通过 Adapter/Registry 机制，支持多模型/多供应商的灵活切换与降级
- 支持配置优先级、fallback、mock、本地/远程等多种策略，保证高可用和可测试性
- 业务层/Hook 层只依赖统一接口，无需关心底层模型与供应商

### 9.4 示例能力映射表

| 功能/工具              | 支持模型/供应商（部分举例）                  |
|----------------------|------------------------------------------|
| AI 视频生成           | Kling AI、Runway、Vidu AI、PixVerse 等         |
| 图生视频              | Runway、Vidu AI、Luma AI 等                 |
| 视频增强/延长          | Runway、Veo、Hunyuan 等                     |
| AI 艺术生成           | Recraft、Ideogram、Stable Diffusion、Dall-E  |
| 背景/物体移除          | Stable Diffusion、FLUX 等                    |
| 图片增强/动漫超分       | Anime Upscaler、Image Enhancer 等             |
| 文本生成              | OpenAI、Gemini、Deepseek、Anthropic、Mistral 等 |
| ...                  | ...                                      |

---

## 10. 未来扩展与最佳实践

- 支持任意新增 AI 工具/模型/供应商，无需重构业务代码
- 推荐每个模型/通道单独封装，接口对齐，便于维护与测试
- 业务服务层/Hook 层保持解耦，便于前后端和多端复用
- 支持多模态、多供应商、多通道灵活切换，满足复杂业务需求

---

如需补充能力矩阵、业务映射表或具体服务/模型接入方案，请参考本目录下各实现文件或联系架构负责人。