# 匹配服务适配器说明

本目录下的 ServiceAdapter 负责“数据聚合/同步/过滤”，不实现任何智能评分算法（如八字、MBTI等），所有智能算法统一由 `ai-adapters` 层负责。

## 适配器类型

### 1. HybridMatchServiceAdapter
- 离线优先，聚合本地与远程数据。
- 仅做数据聚合、同步、简单业务过滤。

### 2. RemoteMatchServiceAdapter
- 纯远程API适配，所有操作通过远程接口。
- 仅做数据聚合、同步、简单业务过滤。

### 3. MockMatchServiceAdapter
- 本地 mock，开发/测试用。
- 仅做数据聚合、同步、简单业务过滤。

### 4. 品牌定制适配器（示例）
- **BrandAMatchServiceAdapter**：优先推荐同城用户（如 city === 'shanghai'），过滤未实名用户。
- **BrandBMatchServiceAdapter**：只展示 VIP 用户（isVIP），过滤黑名单（isBlacklisted）。
- 可根据实际业务需求扩展其它品牌专属过滤逻辑（如同为苹果手机用户、学历等）。

## 设计原则
- 所有 ServiceAdapter 只负责“数据聚合/同步/过滤”，不做智能评分。
- 智能算法（如八字、MBTI、兴趣等）全部在 `ai-adapters` 层实现。
- 业务定制过滤可通过品牌适配器灵活扩展。

## 推荐用法
- 先用 ServiceAdapter 获取候选用户/匹配关系。
- 再通过 DefaultMatchAIAdapter 等 AI 层进行多机制智能评分与排序。

## 典型品牌过滤场景

- **同城用户过滤**：BrandAMatchServiceAdapter 根据 city 字段过滤同城用户。
- **VIP 用户展示**：BrandBMatchServiceAdapter 根据 isVIP 字段展示 VIP 用户。
- **黑名单过滤**：BrandBMatchServiceAdapter 根据 isBlacklisted 字段过滤黑名单用户。

---
如需扩展品牌适配器或特殊过滤逻辑，请在本目录下新增对应文件并实现所需 filter。