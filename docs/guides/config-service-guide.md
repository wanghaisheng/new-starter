# 配置服务（ConfigService）使用与最佳实践

> 适用范围：全局环境变量、动态业务配置、远程参数、灰度/实验开关等

---

## 一、核心理念与架构

- **集中声明**：所有配置 key 必须在 `src/core/services/infrastructure/config/config-keys.ts` 注册，类型自动推断，避免魔法字符串。
- **类型安全**：所有配置操作均使用 `ConfigKey` 类型，防止 string 类型误用导致 TS 报错。
- **分层适配**：支持本地环境变量、远程配置中心、Mock/测试多种适配器，运行时自动切换。
- **响应式订阅**：通过 hooks（`useConfig`/`useConfigContext`）或 Provider 批量订阅配置变更，页面/业务自动响应。

---

## 二、典型用法

### 1. 单变量订阅
```typescript
import { useConfig } from '@/core/hooks/useConfig';
import { CONFIG_KEYS } from '@/core/services/infrastructure/config/config-keys';

const { value, loading, error, refresh } = useConfig(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL);
```
- 推荐只通过 `CONFIG_KEYS` 常量访问 key。
- 返回值统一：`value`、`loading`、`error`、`refresh`。

### 2. 批量 keys 订阅（Provider）
```tsx
import { ConfigProvider } from '@/core/services/infrastructure/config/ConfigProvider';
import { CONFIG_KEYS, ConfigKey } from '@/core/services/infrastructure/config/config-keys';

const keys: ConfigKey[] = [
  CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL,
  CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL,
];

<ConfigProvider keys={keys}>
  <App />
</ConfigProvider>
```
- `keys` 必须类型断言为 `ConfigKey[]`，避免推断为 string[]。

### 3. 组件/业务 hooks 内消费
```typescript
import { useConfigContext } from '@/core/services/infrastructure/config/ConfigProvider';
const { config, loading, error, refresh } = useConfigContext();

useEffect(() => {
  // config.NEXT_PUBLIC_API_BASE_URL 变化时自动响应
}, [config.NEXT_PUBLIC_API_BASE_URL]);
```

### 4. 测试/Mock 场景
```typescript
mockGet.mockImplementation((key: ConfigKey) => {
  if (key === CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL) return 'http://localhost:3000';
  return undefined;
});
```
- 所有 mock 参数类型必须为 `ConfigKey`，防止类型污染。

---

## 三、最佳实践与注意事项

- 禁止直接访问 process.env，统一通过 ConfigService/useConfig/useConfigContext。
- 新增配置项需同步注册到 `config-keys.ts` 并补全类型。
- hooks/Provider/测试用例全部遵循类型安全、批量 keys 管理和自动推送规范。
- 配置变更流程建议：PR→自动校验→合并→前端自动拉取。
- 高风险配置建议双人复核，支持一键回滚。

---

## 四、常见类型错误与排查

- keys 推断为 string[] 导致 TS2322 报错：需 `as ConfigKey[]` 明确断言。
- mock/测试用例参数类型为 string：需统一为 `ConfigKey`。
- config 访问必须用 `config[CONFIG_KEYS.KEY]`，避免直接点属性。

---

## 五、延伸阅读
- [config-keys.ts 设计说明](../../src/core/services/infrastructure/config/config-keys.ts)
- [ConfigProvider 实现原理](../../src/core/services/infrastructure/config/ConfigProvider.tsx)
- [配置服务 FAQ 与风险应急](../planning.md)

如需自动化校验脚本、业务最佳实践或遇到复杂类型报错，请联系维护者。
