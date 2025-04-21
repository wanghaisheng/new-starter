# 业务 hooks 目录说明

本目录用于统一存放所有与业务服务、数据流相关的 React hooks。页面/组件的业务数据获取与变更必须通过本目录下 hooks 实现，禁止直接调用 ServiceFactory/Service。

## 设计规范
- 所有业务 hooks 必须通过 Registry 获取服务实例，禁止 Factory 直连。
- 返回值统一包含 loading、error（分类型）、empty。
- 支持组合 hooks、异常处理与用户提示（如 setToastMessage、triggerToast）。
- 支持 Mock/测试环境自动降级。

## 目录结构示例
```
src/core/services/hooks/
├── useUser.ts
├── useMessages.ts
├── useMatches.ts
├── useQuiz.ts
├── useAuth.ts
├── useToast.ts
├── useAsyncAction.ts
└── ...
```

## 典型用法
```typescript
const { data, loading, error, empty } = useUser();
```

## 其它说明
- 通用/工具/非业务 hooks（如 useDebounce/useEventListener/useDarkMode 等）请放在 src/core/hooks 或 src/shared/hooks 下。
- 业务 hooks 必须有对应的服务实现和测试用例。
