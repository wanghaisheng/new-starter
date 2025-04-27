# 匹配服务体系设计与最佳实践

本目录实现了多品牌、多环境、多算法的高度可扩展匹配服务，支持 provider/brand/algorithm/context 等多维度分流，适配多端多业务场景。

---

## 1. 核心分层架构

- **Provider**：决定主后端/运行环境（如 remote、local、hybrid、mock、brandA、brandB 等）。
- **Adapter**：具体实现 provider/brand 的业务逻辑，支持品牌/环境/策略差异化。
- **AIAdapter**：聚合地理、兴趣、八字、MBTI 等多种算法，支持品牌/算法策略扩展。
- **Options/Context**：所有差异化参数（brand、algoVersion、featureFlag、userType、region、env 等）通过 options/context 注入。
- **Factory/Registry**：统一注册、动态分流、自动降级，支持插件化注册和优先级排序。
- **Service/Hook**：业务层统一通过 hooks/useMatches 获取服务实例，禁止直接 new/直连 Factory。

---

## 2. 目录结构说明

```
adapters/         # 各品牌/provider 适配器（如 brandA、brandB、hybrid、mock、remote）
ai-adapters/      # 匹配算法适配器，支持算法策略/品牌差异化
factory/          # 工厂，统一注册和创建服务实例
registry/         # 注册表，管理全局服务实例
service/          # 聚合业务服务，业务层只关心 MatchService
hooks/            # useMatches 等业务 hooks（建议实现）
types/            # 类型定义（MatchServiceType、Options、IMatchService、IMatchAIAdapter 等）
```

---

## 3. 智能匹配机制与扩展说明

- **核心入口：MatchService.matchUsers(userId, opts)**
  - 负责业务参数拼装、调用候选池（UserService.getRecommendedUsers）与算法适配器（aiAdapter.matchUsers）。
  - 支持通过 opts 参数灵活组合多种算法（地理、标签、八字、MBTI、随机等）。
  - 兜底策略（如随机推荐）已在 aiAdapter 内部实现。
  - 推荐人数上限（如付费/免费用户每日推荐数）建议在业务层通过 opts.limit 动态控制。

- **算法扩展与管理**
  - 所有匹配算法集中在 aiAdapter 层实现，业务层无需关心算法细节。
  - 新增算法时只需扩展 IMatchAIAdapter 接口和 DefaultMatchAIAdapter 实现，并在 matchUsers 内组合调用。
  - 支持通过 opts 参数灵活控制算法启用、权重、排序等。
  - 支持多品牌/多策略切换，可通过工厂/注册表动态选择不同适配器。

- **最佳实践**
  - 推荐池生成与智能匹配算法分层解耦，便于维护和扩展。
  - 业务层只关注参数和流程，算法管理全部交由 Adapter 层。
  - 推荐人数等业务策略建议在 MatchService 层统一控制。

---

## 4. 多维度分流与扩展

- **Provider/Brand 分流**：工厂/注册表按 provider+brand+options 动态获取最优适配器。
- **算法策略/品牌算法**：AIAdapter 支持根据 brand、algoVersion、featureFlag、userType 等灵活切换算法。
- **环境/用户/场景**：options/context 支持 region、env、userType、灰度发布、A/B 测试等多维扩展。
- **插件化/策略模式**：适配器与 AIAdapter 支持插件注册，便于未来新增品牌、算法、策略。
- **自动降级**：找不到品牌专用适配器时自动 fallback 到 hybrid/mock，适合灰度与测试。

---

## 5. 业务调用统一范式

```typescript
// 推荐通过 hooks 获取服务实例
const { matches, isLoading, error, empty } = useMatches({ provider: 'hybrid', brand: 'huawei', algoVersion: 2 });

// Service 层调用（如需更细粒度控制）
const matchService = MatchServiceRegistry.getInstance().getService({
  provider: 'remote',
  brand: 'brandA',
  algoVersion: 'v2',
  userType: 'vip',
  region: 'CN',
  featureFlag: 'new-bazi'
});
```

- 禁止页面/组件直接 new Adapter 或 Factory.createService，必须通过 hooks 或 Registry 获取服务实例。
- hooks/useMatches 返回值统一包含 loading、error、empty，异常细分类型，便于页面友好渲染与提示。

---

## 6. hooks 与服务层规范

- 所有页面/组件数据流必须走 hooks，禁止直接 ServiceFactory/Service。
- hooks 内部服务实例获取全部通过 Registry，移除冗余 useEffect、全局变量。
- hooks 返回值统一 loading/error/empty，异常类型细分。
- hooks 支持组合与扩展（如 useMatches + useUser）。
- Mock/测试环境下 hooks 自动降级到 mock service。
- 详细用法和最佳实践见 hooks/README.md。

---

## 7. 扩展与最佳实践

- 新增品牌/算法/环境时，仅需扩展 adapters/ai-adapters 并注册即可，无需大改主流程。
- 推荐所有适配器和 AIAdapter 构造函数支持 options/context，便于未来多维度动态分流。
- 工厂/注册表支持插件化注册和优先级排序，满足更复杂的多品牌/多环境/多策略场景。
- 持续完善 readme.md，补充 options/context 支持的所有维度及扩展方法。

---

如需详细模板、插件机制样例、注册表分流实现或批量升级脚本，请联系维护者。