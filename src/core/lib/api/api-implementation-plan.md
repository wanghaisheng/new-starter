# src/core/lib/api 实现计划

本计划文档旨在指导团队高效、有序地实现和维护 AI 通道聚合层（lib/api），确保多供应商、多模态能力的可扩展性和业务无关性。

---

## 1. 目标与原则

- 实现“通道聚合+标准化接口”分层架构，支持多供应商、多模态（文本/图片/视频/音频/音乐等）统一调用。
- 每个供应商/通道单独封装，接口标准化，便于扩展与维护。
- 支持通道注册、优先级、fallback、mock、本地/远程等策略。
- 业务 Adapter/Service/Hook 只依赖统一接口，无需关心底层实现。

---

## 2. 目录与模块规划

```
src/core/lib/api/
├── openai.ts           # OpenAI 官方 API 封装
├── deepseek.ts         # Deepseek 官方 API 封装
├── openrouter.ts       # OpenRouter 聚合代理通道
├── genkit/             # Genkit flows/actions 封装
├── vercel-ai-sdk/      # Vercel AI SDK 封装
├── custom-proxy.ts     # 自建 API 代理通道
├── ai-channel.ts       # 统一 AIChannel 接口定义
├── ai-channel-registry.ts # 通道注册/切换/优先级/fallback
├── types.ts            # 通用类型定义
├── readme.md           # 设计说明与能力矩阵
└── ...                 # 其它供应商/新通道可随时扩展
```

---

## 3. 实施步骤

### 3.1 统一接口与类型定义
- [ ] 定义 AIChannel 接口，规范 generateText/generateImage/generateVideo 等方法。
- [ ] 在 types.ts 统一定义 AIOptions、AIResult、异常结构等。

### 3.2 通道实现与注册
- [ ] 每个供应商/通道独立实现（openai.ts、deepseek.ts、openrouter.ts、genkit/、vercel-ai-sdk/等），均实现 AIChannel 接口。
- [ ] 在 ai-channel-registry.ts 注册所有通道，支持优先级、fallback、mock、本地/远程等切换策略。

### 3.3 文档与用例
- [ ] 每个通道配套 md 文档，说明用法、参数、异常处理、测试建议。
- [ ] readme.md 持续维护设计方案、能力矩阵、集成说明。

### 3.4 业务集成与测试
- [ ] Adapter/Service/Hook 只依赖 AIChannel 统一接口。
- [ ] 编写单元测试与集成测试，覆盖多通道/多模型/多模态场景。
- [ ] 支持 mock、本地/远程、流式/非流式等多种测试策略。

---

## 4. 里程碑与责任分工

- 第一阶段：接口与类型定义，完成时间：T+2d，责任人：架构负责人
- 第二阶段：主流通道（openai、deepseek、openrouter、genkit、vercel-ai-sdk）实现与注册，T+7d，责任人：各通道负责人
- 第三阶段：文档与测试用例完善，T+10d，责任人：全员参与
- 第四阶段：业务 Adapter/Service/Hook 全面切换至统一接口，T+14d，责任人：业务负责人

---

## 5. 扩展与维护建议

- 新增供应商/模型/模态时，优先实现独立封装与注册，无需动业务层代码。
- 持续完善文档与测试，定期 review 代码规范与能力矩阵。
- 支持多端/多环境/多场景灵活切换，满足未来业务扩展需求。

---

如有疑问或建议，请联系架构负责人或查阅本目录下文档。
