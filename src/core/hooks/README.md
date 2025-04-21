# 通用/工具 hooks 目录说明

本目录用于存放所有非业务数据流相关的 React hooks，例如 UI 适配、动画、事件监听、工具函数等。此类 hooks 不依赖服务层，可被任意页面/组件复用。

## 设计规范
- 不涉及业务服务、数据流，仅做 UI/工具/适配。
- 命名统一 useXxx。
- 如需复用，可考虑迁移到 src/shared/hooks/。

## 目录结构示例
```
src/core/hooks/
├── useDebounce.ts
├── useEventListener.ts
├── useIsMobile.ts
├── useDarkMode.ts
└── ...
```

## 其它说明
- 所有业务数据流 hooks 必须放在 src/core/services/hooks/ 下，遵循统一服务获取与状态规范。

## 设计原则
- **解耦 UI 与服务层**：hooks 封装服务调用，组件只需关心数据与交互。
- **统一状态管理**：自动处理 loading、error、data、重试、网络状态等，无需重复造轮子。
- **环境无关**：底层服务通过工厂/适配器模式自动切换，hooks 层无需关心。
- **高复用性**：业务 hooks 可组合、可扩展，支持跨页面/组件复用。

## 统一返回结构与 error 细分范式（2025 修订）

### 1. 返回结构规范
所有通用 hooks 返回值**必须统一**包含：
- `loading`（全局加载）
- `empty`（空状态）
- 针对每类操作的 error 字段（如 fetchError、updateError、deleteError、purchaseError、actionError、markError 等）
- 相关操作方法（如 fetch/update/delete/purchase/submit 等）

页面/组件应直接根据不同 error 字段精准渲染操作级错误提示。

### 2. 代码示例

#### useDebounce
```tsx
const { value, loading, error, debounce } = useDebounce();
if (error) return <ErrorView msg={error.message} />;
```

#### useEventListener
```tsx
const { event, error, addEventListener } = useEventListener();
if (error) showToast(error.message);
```

#### useIsMobile
```tsx
const { isMobile, error } = useIsMobile();
if (error) return <ErrorView msg={error.message} />;
```

#### useDarkMode
```tsx
const { isDarkMode, error, toggleDarkMode } = useDarkMode();
if (error) showToast(error.message);
```

### 3. 服务实例获取规范
- hooks 内部统一通过 Registry 获取服务实例，禁止直接调用 Factory。
- Registry 负责服务实例唯一性与多环境治理。

### 4. 页面端渲染建议
- 根据不同 error 字段分别渲染错误提示
- loading/empty 状态友好处理
- 不同操作的 toast/提示建议与 error 字段解耦

### 5. 组合与扩展
- 可组合多个 hooks（如 useDebounce + useEventListener）实现更复杂的业务逻辑
- hooks 可嵌套调用，提升代码复用性

## Error 处理与返回值规范

### 1. error 字段类型
- 所有 hooks 的 error 字段类型必须为 `Error | null`，禁止 string/any。
- 事件驱动型 hooks 的 error 事件 payload 结构为 `{ error: Error }`。

### 2. 异常处理链路
- 服务层抛出 Error，hooks 捕获后 setError，并统一触发 toast。
- 页面只需渲染 `error?.message`，无需关心底层实现。

### 3. 典型用法
```tsx
const { data, error, loading } = useUser();
if (loading) return <Skeleton />;
if (error) return <div>{error.message}</div>;
```

### 4. 反例
- 禁止 hooks error 字段为 string/number/any。
- 禁止页面直接 try/catch service 抛出的 string/number。

---
详细 error 处理约定请参考 `docs/guides/best-practices/hooks-error-handling.md`。

## 业务数据流 hooks 统一范式（重要）

### 1. hooks 层为唯一业务操作出口
- 所有业务相关的数据获取、变更（如 updateUser、updateMatch、updateMessage 等）**必须统一由 hooks 层暴露**，页面/组件禁止直接调用 Service/Factory/Registry。
- hooks 内部通过 Registry 获取服务实例，自动适配 mock/remote/hybrid 等环境。
- hooks 返回值统一包含 loading、empty、各类 error 字段，以及所有业务操作方法（如 updateUser、updateMatch、deleteUser、createMatch 等）。
- Provider 仅做 context 容器，业务副作用全部交由 hooks 实现。

### 2. 典型 hooks 业务操作方法示例

#### useUser
```tsx
const { user, updateUser, loading, updateError } = useUser();
await updateUser({ name: '新昵称' });
```

#### useMatches
```tsx
const { matches, updateMatch, updateError } = useMatches(userId);
await updateMatch(matchId, { status: 'accepted' });
```

#### useMessages
```tsx
const { messages, updateMessage, updateError } = useMessages(conversationId);
await updateMessage(messageId, { content: '新内容' });
```

### 3. 设计原则
- hooks 层是所有业务副作用（如接口调用、数据同步、toast、错误处理等）的唯一出口。
- 页面/组件只通过 hooks 获取和操作业务数据，最大化解耦和复用。
- hooks 组合/扩展灵活（如 useUser + useAuth, useMatches + useUser 等）。

---

如需扩展业务 hooks，务必遵循上述范式，详见各 hooks 文件注释及示例。

---

> 以上为 2025 年 hooks error 细分与统一返回最佳实践。所有新/重构 hooks 请严格参照执行。

如需更多典型用法或页面端最佳实践，可补充具体场景。
