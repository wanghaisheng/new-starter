# 匹配服务设计说明

## 一、架构总览
匹配服务采用分层架构，核心由 Adapter（适配器）和 Enhancer（增强器）两大模块组成。主流程通过动态组合不同类型的 Adapter 和 Enhancer，实现灵活、可扩展的匹配策略。

- **Adapter（适配器）**：负责对接各类匹配算法，实现候选池的初步筛选与召回。
- **Enhancer（增强器）**：对 Adapter 输出的候选池进行后处理，如排序、去重、A/B 测试、灰度发布等。

## 二、Adapter 设计与职责
- 每个 Adapter 封装一种或一类匹配算法（如规则匹配、协同过滤、内容推荐等），对外暴露统一接口。
- Adapter 需实现类型安全的数据输入输出，便于主流程组合和扩展。
- 支持多 Adapter 级联、聚合，提升召回多样性和覆盖率。
- 典型职责：
  - 接收匹配请求参数
  - 调用具体算法/模型/外部服务
  - 返回初步候选池（含基础分数/标签等）

## 三、Enhancer 设计与作用
- Enhancer 以插件方式对候选池进行增强处理。
- 常见类型：
  - **排序增强器**：根据业务规则或模型分数对候选排序
  - **去重增强器**：消除重复项，保证结果多样性
  - **A/B 测试增强器**：动态分流不同策略，支持灰度发布
  - **过滤增强器**：按需过滤不合规或不活跃候选
- 支持链式组合，顺序可配置。

## 四、主流程与动态组合
- 主流程根据配置动态组合 Adapter 和 Enhancer，实现灵活的匹配策略。
- 支持运行时注入、扩展新类型 Adapter/Enhancer，无需改动主流程代码。
- 典型流程：
  1. 解析请求，选择合适 Adapter 列表
  2. 依次执行 Adapter，聚合候选池
  3. 按配置顺序执行 Enhancer，逐步增强候选池
  4. 返回最终匹配结果

## 五、扩展性与类型安全
- Adapter/Enhancer 均实现统一接口，便于新增和替换。
- 强类型定义保证主流程组合安全，减少运行时错误。
- 支持配置化扩展，无需侵入式开发。

## 六、与用户服务和仓储的集成
- Adapter 可调用用户服务获取画像、偏好等信息，提升匹配精准度。
- 支持与仓储层集成，持久化匹配日志、A/B 测试分流结果等。

## 七、典型调用流程与接口示例
```typescript
// 匹配主流程伪代码
const adapters = getAdapters(config.adapterList)
let candidates = []
for (const adapter of adapters) {
  candidates = candidates.concat(await adapter.match(requestParams))
}
const enhancers = getEnhancers(config.enhancerList)
for (const enhancer of enhancers) {
  candidates = await enhancer.enhance(candidates, context)
}
return candidates
```

### Adapter 接口示例
```typescript
interface MatchAdapter {
  match(params: MatchRequest): Promise<Candidate[]>;
}
```

### Enhancer 接口示例
```typescript
interface MatchEnhancer {
  enhance(candidates: Candidate[], context: EnhanceContext): Promise<Candidate[]>;
}
```

## 八、总结
该架构支持灵活扩展、类型安全，便于团队理解和维护。通过 Adapter 与 Enhancer 的分层组合，可快速适配多种业务场景和策略，满足未来持续演进需求。