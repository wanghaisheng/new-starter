# 匹配功能需求、设计与实现文档

## 1. 需求描述

### 1.1 用户核心需求
- 快速获得高相关性推荐对象，提升匹配效率（首页主推荐流）。
- 主动探索不同类型、算法、条件下的匹配对象，获得新鲜感和趣味性（发现页探索）。
- 支持多种智能匹配机制（如八字、MBTI、地理位置、兴趣标签、随机等）。
- 匹配过程简单，支持一键喜欢/不喜欢，支持多算法融合或单算法筛选。

### 1.2 业务目标
- 提高用户互动率、匹配成功率和留存。
- 满足不同用户（主流型、探索型、尝鲜型）的多样化需求。
- 支持产品快速扩展新算法和运营活动。

---

## 2. 设计方案

### 2.1 架构原则
- 所有页面/组件统一通过 hooks/useMatches 获取和操作匹配数据，禁止直接 ServiceFactory/Service。
- 推荐/匹配池类型通过 context 明确表达，服务端/适配器自动分流。
- hooks 返回值统一 loading/error/empty，页面友好渲染。
- 支持多算法（八字/MBTI/地理/兴趣/随机等）通过 context 灵活切换。

### 2.2 context 结构示例
```typescript
export interface MatchContext {
  userId: string;
  scene: 'home' | 'discover' | 'search' | string;
  brand?: string;
  provider?: string;
  region?: string;
  featureFlag?: string;
  useBazi?: boolean;
  useMBTI?: boolean;
  useGeo?: boolean;
  useRandom?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  [key: string]: any;
}
```

### 2.3 页面与匹配方式
- **首页（Home）**：主流推荐，系统自动融合多算法，用户可选“全部融合”或单算法。
- **发现页（Discover）**：用户可主动选择八字/MBTI/地理/兴趣/随机等匹配方式，并可组合筛选。
- **随机匹配**：作为发现页的兜底入口，保证新鲜感和趣味性。

### 2.4 hooks/useMatches 设计
- 支持 context 参数化（如 useMatches(context: MatchContext)）。
- 返回核心操作：
  - `matches`: 匹配关系
  - `matchUsers`: 推荐池（支持 context 多算法分流）
  - `createMatch`, `updateMatch`, `deleteMatch`
  - `loading`, `error`, `empty`
- matchUsers 支持 context 透传，如 `matchUsers(userId, context)`。

---

## 3. 实现示例

### 3.1 hooks/useMatches 示例
```typescript
export function useMatches(options: MatchContext) {
  // ...省略其它实现...
  const matchUsers = useCallback(async (userId: string, ctx: MatchContext) => {
    if (!serviceRef.current) throw new Error('服务未初始化');
    return await serviceRef.current.matchUsers(userId, ctx);
  }, []);
  // ...
  return { matches, matchUsers, createMatch, updateMatch, deleteMatch, loading, error, empty };
}
```

### 3.2 首页页面调用
```tsx
const [selectedAlgos, setSelectedAlgos] = useState<string[]>(['useBazi', 'useMBTI', 'useGeo']);
const context = {
  userId: user.id,
  scene: 'home',
  ...Object.fromEntries(selectedAlgos.map(k => [k, true]))
};
const { matchUsers, loading, error, empty } = useMatches(context);
useEffect(() => {
  matchUsers(user.id, context);
}, [user.id, JSON.stringify(selectedAlgos)]);
```

### 3.3 发现页页面调用
```tsx
const MATCH_MODES = [
  { key: 'random', label: '随机匹配', context: { useRandom: true } },
  { key: 'bazi', label: '八字匹配', context: { useBazi: true } },
  { key: 'mbti', label: 'MBTI匹配', context: { useMBTI: true } },
  { key: 'geo', label: '同城优选', context: { region: 'shanghai' } },
];
const [activeMode, setActiveMode] = useState('random');
const modeContext = MATCH_MODES.find(m => m.key === activeMode)?.context || {};
const context = {
  userId: user.id,
  scene: 'discover',
  ...modeContext,
  includeTags: customTags.length > 0 ? customTags : undefined
};
const { matchUsers, loading, error, empty } = useMatches(context);
useEffect(() => {
  matchUsers(user.id, context);
}, [user.id, activeMode, JSON.stringify(customTags)]);
```

---

## 4. 服务端/适配器分流建议
- 根据 context.useBazi/useMBTI/useGeo/useRandom/region 等参数自动切换或融合推荐算法。
- 首页主 feed 推荐算法由后端融合决策，发现页/搜索页支持 context 主动分流。

---

## 5. 价值总结
- 满足不同用户对高效匹配与探索新鲜的双重需求。
- 支持产品快速扩展新算法和运营活动。
- 统一 hooks/服务分流，提升代码可维护性和团队协作效率。
