# messages 服务迁移与接口清单

## 目录结构规划

本目录用于承载新架构下的消息服务（messages），包括核心服务、适配器、工厂、注册表、类型定义等，逐步迁移自 deprecated/messages。

- adapters/  适配器实现
  - ai-message-assistant-adapter.ts：AI 智能助手能力适配器，实现智能回复、内容分析等，依赖 AI 服务，支持多种模型扩展。
  - content-safety-filter-adapter.ts：内容安全过滤适配器，实现消息内容的合规检测与敏感词过滤，支持自定义规则和第三方服务对接。
  - multi-device-sync-adapter.ts：多端同步适配器，实现消息在 Web/APP/小程序等多端的同步、推送与草稿管理，支持端到端加密同步。
  - teen-safety-adapter.ts：青少年安全适配器，实现青少年用户消息的安全检测、内容分级与限制，支持家长监控与合规存证。
  - （建议后续补充：消息撤回与编辑、加密与隐私、优先级与分组、多媒体、国际化、审计、限流、归档等适配器，分别聚焦各自高级特性，按需扩展）
- factory/    工厂模式相关
- registry/   注册表实现
- service/    核心服务实现
- types/      类型定义

## 高级特性与设计原则

### 适配器设计与职责说明

本目录下每个适配器（adapters）均聚焦单一高级特性，遵循统一接口规范，便于与主消息服务灵活组合。各适配器职责如下：
- AI 智能助手适配器：负责集成 AI 服务，实现智能回复、内容分析等能力，支持多模型扩展，所有输出需经过内容安全检测。
- 多端同步适配器：负责消息在多终端间的同步、推送、草稿等，兼容不同终端能力，支持端到端加密与离线同步。
- 青少年安全适配器：负责青少年用户消息的内容安全检测、分级、限制与留痕，支持家长监控与合规存证。
- 内容安全过滤适配器：负责所有消息内容的合规检测与敏感词过滤，支持多种内容安全服务切换。
- 其他适配器（建议补充）：如消息撤回与编辑、加密与隐私、优先级与分组、多媒体、国际化、审计、限流、归档等，均应实现统一接口，聚焦自身特性。

扩展点与协作方式：
- 每个适配器可独立扩展，支持与外部 API 或数据服务协同，需在实现中明确依赖关系与调用流程。
- 适配器层仅做数据搬运/聚合/同步，复杂逻辑在业务/AI 层实现，确保分层清晰、架构灵活、易于维护和后续扩展。
- 所有适配器均可通过工厂与注册表机制动态注册与组合，便于业务按需启用。

### 1. AI 智能助手能力
- 支持集成 AI 智能助手（如机器人、智能回复、情感分析等），通过适配器层以可插拔方式注入。
- AI 能力可作为扩展点，业务层可根据需求选择性启用。
- 所有 AI 相关消息需经过内容安全检测与敏感词过滤，确保合规。
- 设计原则：AI 能力应模块化、可插拔，便于后续扩展。
- 合规要求：需严格遵守数据安全与隐私保护规范。
- 扩展点：支持多种 AI 服务接入，便于快速适配新能力。

### 2. 多端同步能力
- 支持 Web/APP/小程序等多端消息同步，包括已读、推送、草稿等状态。
- 多端同步通过适配器聚合实现，底层依赖仓储层统一数据源。
- 适配器需兼容不同终端能力，提升多端体验。
- 设计原则：同步机制需高可用、低延迟，保证一致性。
- 合规要求：同步数据需加密传输，防止泄露。
- 扩展点：支持端到端加密同步、离线同步等高级特性。

### 3. 青少年安全与合规
- 针对青少年用户，所有消息需额外进行内容安全校验，自动识别拦截不良/涉黄/诈骗等违规内容。
- 支持反骚扰、黑名单、举报、夜间消息限制等安全机制。
- 青少年消息需留痕、支持家长监控与合规存证。
- 相关校验逻辑建议在业务/AI 层实现，适配器层负责调用。
- 设计原则：安全机制需可配置、可扩展，便于合规升级。
- 合规要求：严格遵守国家青少年保护法规。
- 扩展点：支持第三方安全服务接入。

### 4. 内容安全过滤
- 所有消息内容必须经过内容安全检测和敏感词过滤，禁止直接写入或下发未审核内容。
- 内容安全能力通过仓储/业务层统一实现，适配器层仅做调用和结果聚合。
- 支持扩展第三方内容安全服务。
- 设计原则：安全过滤应高效、准确，支持自定义规则。
- 合规要求：满足平台及国家内容安全标准。
- 扩展点：支持多种内容安全服务切换。

### 5. 消息撤回与编辑
- 支持消息撤回、编辑，撤回需有时效限制，编辑需留痕。
- 设计原则：撤回与编辑操作需可追溯，防止滥用。
- 合规要求：撤回/编辑记录需合规存档。
- 扩展点：支持多端同步撤回、编辑。

### 6. 消息加密与隐私保护
- 支持消息端到端加密，保障用户隐私。
- 设计原则：加密机制需透明、可扩展，支持多算法。
- 合规要求：符合数据加密与隐私保护法规。
- 扩展点：支持自定义加密插件。

### 7. 消息优先级与分组
- 支持消息优先级标记、分组展示。
- 设计原则：优先级与分组应灵活配置，便于业务扩展。
- 合规要求：优先级分组规则需透明可追溯。
- 扩展点：支持动态分组、智能分组。

### 8. 多媒体消息支持
- 支持图片、音频、视频、文件等多媒体消息。
- 设计原则：多媒体处理需高效、兼容多端。
- 合规要求：多媒体内容需安全检测、合规存储。
- 扩展点：支持多种格式扩展、转码。

### 9. 国际化与多语言支持
- 支持多语言消息内容、界面国际化。
- 设计原则：国际化方案需灵活、易扩展。
- 合规要求：遵守各地区法律法规。
- 扩展点：支持动态语言切换、自动翻译。

### 10. 消息追踪与审计
- 支持消息全链路追踪、操作审计。
- 设计原则：审计日志需安全、不可篡改。
- 合规要求：满足合规审计要求。
- 扩展点：支持第三方审计系统对接。

### 11. 消息限流与防刷
- 支持消息发送频率限制、防止恶意刷屏。
- 设计原则：限流策略需灵活、可配置。
- 合规要求：防刷机制需合规、透明。
- 扩展点：支持多维度限流、黑名单。

### 12. 消息归档与备份
- 支持消息归档、历史消息备份与恢复。
- 设计原则：归档机制需高效、可扩展。
- 合规要求：归档数据需加密存储、合规保留。
- 扩展点：支持多种归档策略、自动备份。

### 13. 扩展点与分层实现
- 高级特性（AI、同步、安全、撤回、加密等）均以扩展点形式注入，适配器层负责聚合与分发。
- 严格分层：适配器层仅做数据搬运/聚合/同步，复杂逻辑在业务/AI 层实现。
- 所有实现需依赖 repository 层，禁止直接操作底层 dataService/ORM。

### 14. 合规与维护要求
- 所有消息服务实现需满足国家/平台合规要求，重点关注青少年保护与内容安全。
- 迁移及新增特性需同步补充接口清单、类型声明和测试用例。
- 设计原则、合规要求和扩展点说明需在本文件持续更新，便于团队理解和维护。

## 接口与方法清单（持续补充）

请根据旧服务 `service/message-service.ts`、`adapters/`、`factory/`、`registry/` 等文件，梳理并补充所有对外接口和核心方法，确保类型安全和分层清晰。

### 1. 消息服务核心接口
- sendMessage(params): Promise<Message>
- getMessages(query): Promise<Message[]>
- deleteMessage(id): Promise<boolean>
- updateMessage(id, data): Promise<Message>
- recallMessage(id): Promise<boolean>
- editMessage(id, data): Promise<Message>
- encryptMessage(id): Promise<Message>
- setPriority(id, level): Promise<boolean>
- groupMessages(criteria): Promise<MessageGroup[]>
- sendMediaMessage(params): Promise<Message>
- translateMessage(id, lang): Promise<Message>
- auditMessage(id): Promise<AuditLog>
- limitMessageRate(userId, limit): Promise<boolean>
- archiveMessages(criteria): Promise<boolean>
- registerAdapter(adapter): void
- ...（持续补充）

### 2. 适配器接口
- send(params): Promise<Message>
- fetch(query): Promise<Message[]>
- recall(id): Promise<boolean>
- edit(id, data): Promise<Message>
- sendMedia(params): Promise<Message>
- ...

### 3. 工厂与注册表接口
- createService(type): MessageService
- register(type, adapter): void
- getRegisteredAdapters(): Adapter[]
- ...

## 迁移说明

- 本目录所有实现需依赖 repository 层，禁止直接操作底层 dataService/ORM。
- 迁移时请同步补充接口清单、类型声明和测试用例。
- 迁移进度与说明请同步更新至 MIGRATION_TASKS.md。
- 高级特性与接口清单需持续完善，确保架构演进与业务需求同步。

## 负责人
- 待分配

---

如需迁移模板、自动化脚本或接口示例，请在本文件下补充。


# 消息服务架构说明

## 适配器（Adapter）与增强器（Enhancer）职责

- **适配器（Adapter）**：每种消息类型（如文本、图片、音频等）应有一个主适配器，负责该类型消息的核心处理、分发与主流程控制。适配器聚焦于消息的基本生命周期管理、类型判定、路由分发等主流程逻辑。
- **增强器（Enhancer）**：作为可选的功能插件链，增强器对主流程进行功能增强，例如 AI 智能处理、内容安全检测、加密、国际化、多媒体处理、优先级分组、撤回编辑、青少年安全等。增强器链可按需动态组合，增强主适配器的能力。

> 适配器与增强器应职责分明：适配器主导消息类型的主流程，增强器专注于附加功能。

## 初始化流程配置示例

```ts
const messageType = configService.get('NEXT_PUBLIC_MESSAGE_TYPE') || MessageType.TEXT;
const enhancerRaw = configService.get('NEXT_PUBLIC_MESSAGE_FEATURES') || [];
const enhancerList = Array.isArray(enhancerRaw)
  ? enhancerRaw
  : typeof enhancerRaw === 'string'
    ? enhancerRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
const enhancerMap = {
  [MessageEnhancerType.AI]: () => new AIEnhancer(),
  [MessageEnhancerType.CONTENT_SAFETY]: () => new ContentSafetyEnhancer(),
  // ... 其他增强器
};
const enhancers = enhancerList.map(key => enhancerMap[key as MessageEnhancerType]?.()).filter(Boolean);
const messageConfig: MessageServiceConfig = { messageType, features: enhancerList };
const messageRepository = new MessageRepository(dataService);
const messageService = new MessageService(
  messageRepository,
  messageConfig,
  enhancers,
);
```

- 通过配置 `messageType` 选择主适配器，`enhancerList` 动态组合增强器。
- 每种消息类型可扩展独立适配器，增强器链可灵活插拔。

## 推荐实践
- 明确区分适配器（主流程）与增强器（功能插件）的职责。
- 适配器负责不同消息类型的主流程实现，增强器负责功能增强。
- 初始化时根据配置动态组合，便于业务扩展和团队协作。