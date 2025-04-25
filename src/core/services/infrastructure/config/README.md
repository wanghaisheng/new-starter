# Config Service & 全局配置最佳实践

本目录用于管理全局配置服务（ConfigService），提供应用运行期的全局参数、环境变量、远程下发配置等统一入口。

---

## 一、核心特性（2025版增强说明）

- **集中声明与分组**：所有环境变量/配置项集中在 config-keys.ts，分为数据库/ORM、认证、云存储、推送、通用等分组，便于类型推断、自动补全。
- **类型安全**：配套 config-types.ts，所有配置项具备类型提示。
- **适配器解耦**：支持本地环境变量、远程配置中心、缓存等多种适配器，按需组合。
- **运行时热更新**：支持远程配置变更自动生效，业务无需重启即可响应配置变更。
- **订阅/事件机制**：支持业务 hooks/组件订阅单个或批量变量变更，自动推送通知。
- **全局 Context 支持**：通过 ConfigProvider/useConfigContext 实现全局批量订阅，业务 hooks 可自动响应配置变化。
- **CI 校验与文档同步**：推荐在 CI 校验 config-keys.ts、config-types.ts、环境变量文档一致性。

---

## 二、典型用法与最佳实践

### 1. 单变量订阅（响应式 hooks）
```typescript
const { value: apiBaseUrl, loading, error, refresh } = useConfig(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL);
```
- 变量变更（set/refresh/远程推送）自动触发组件刷新。

### 2. 批量订阅与全局 Context
```tsx
// 入口文件 _app.tsx
<ConfigProvider keys={[CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL, CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL]}>
  <App />
</ConfigProvider>

// 业务 hooks/组件内
const { config, loading, error, refresh } = useConfigContext();
useEffect(() => {
  // config.NEXT_PUBLIC_API_BASE_URL 变化时自动响应
}, [config.NEXT_PUBLIC_API_BASE_URL]);
```
- 支持 hooks/组件自动响应任意配置变量变化。

### 3. 配置热更新（远程/动态变更）
```typescript
const { refresh } = useConfig(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL);
<button onClick={refresh}>刷新配置</button>
```
- 远程配置中心推送变更后，业务层可手动或自动调用 refresh，使新配置即时生效。

### 4. 业务 hooks 级联响应
```typescript
// 以 useApi 为例
const { config } = useConfigContext();
useEffect(() => {
  // API 地址/log 级别等变化时自动重连/切换
}, [config.NEXT_PUBLIC_API_BASE_URL, config.NEXT_PUBLIC_LOG_LEVEL]);
```

---

## 三、ConfigProvider & useConfigContext 说明

本模块为全局配置响应式 Context 与 Provider 实现，支持批量 keys 订阅、自动推送、业务 hooks/组件自动响应配置变化。

### 典型用法

```tsx
// _app.tsx 或页面入口
import { ConfigProvider } from '../context/ConfigProvider';

<ConfigProvider keys={[CONFIG_KEYS.API_BASE_URL, CONFIG_KEYS.LOG_LEVEL]}>
  <App />
</ConfigProvider>

// 业务 hooks/组件
import { useConfigContext } from '../context/ConfigProvider';
const { config, loading, error, refresh } = useConfigContext();
useEffect(() => {
  // config.API_BASE_URL 变化时自动响应
}, [config.API_BASE_URL]);
```

### 能力说明
- 支持批量 keys 订阅与自动推送
- 支持 loading/error/refresh
- 支持 providerType 切换
- 仅需在入口包裹一次，全局 hooks/组件可消费

---

## 四、useConfig 说明

单变量响应式订阅 hooks。

```typescript
import { useConfig } from '../hooks/useConfig';
const { value, loading, error, refresh } = useConfig(CONFIG_KEYS.API_BASE_URL);
```

- 支持单变量订阅与刷新
- 支持 loading/error/refresh
- 支持 providerType 切换

---

## 五、架构演进与适配器扩展

- 支持 EnvConfigAdapter（本地 .env）、RemoteConfigAdapter（远程中心）、CompositeAdapter（多源融合）等多种实现。
- 新增适配器仅需实现 IConfigAdapter 接口并注册，无需改动业务代码。
- 业务层统一通过 configService.get(key) 或 useConfig/useConfigContext 获取配置。

---

## 六、最佳实践与注意事项

- 禁止业务直接访问 process.env，统一通过 configService/useConfig/useConfigContext。
- 新增变量/适配器时同步更新 config-keys.ts、config-types.ts、README.md、environment-variables.md。
- 推荐在 CI/CD 校验关键配置项文档与代码一致性，防止遗漏。
- 业务 hooks/组件如需动态响应配置变化，优先用 useConfig/useConfigContext。
- 不建议将用户个性化、组件局部状态等放入全局配置。

---

## 七、进阶能力

- 支持变量变更订阅、批量订阅、全局 Context、运行时热更新、远程推送。
- 适配器可扩展为支持 WebSocket、轮询、云厂商配置中心等多种远程变更机制。
- 支持变量变更事件联动业务（如自动重连、特性开关、A/B 实验等）。

---

## 八、云端配置中心技术选型与对比

本项目支持多种主流配置中心的对接与热更新，推荐选型如下：

| 配置中心         | REST 拉取 | WebSocket 推送 | SSE 推送 | 长轮询/Watch | 备注                         |
|------------------|-----------|----------------|----------|--------------|------------------------------|
| Consul           | ✅        | ❌（原生不支持）| ❌       | ✅           | 支持 HTTP Blocking Queries，适合定时拉取和近实时需求 |
| Apollo           | ✅        | ✅（社区扩展）  | ❌       | ✅           | 官方支持长轮询，社区有 WS 扩展，适合大规模推送 |
| Nacos            | ✅        | ✅（社区扩展）  | ❌       | ✅           | 官方为长轮询，社区有 WS 扩展 |
| Spring Cloud Config | ✅     | ❌             | ❌       | ❌           | 通常配合 Spring Cloud Bus 通知实现热更新 |
| etcd             | ✅        | ❌             | ❌       | ✅           | 支持 watch，需自研推送层      |
| Firebase Remote Config | ✅  | ❌             | ❌       | ❌           | 仅支持 REST 拉取              |
| 自研/定制        | ✅        | ✅             | ✅       | ✅           | 可根据业务需求自定义推送方式   |

- 推荐：
  - **对实时推送有高要求**（如动态开关、A/B 实验）：优先选 Apollo、Nacos 或自研支持 WebSocket/SSE 的配置中心。
  - **对实时性要求一般**：Consul 配合 Blocking Queries 或定时轮询即可，部署简单。
  - **已有微服务基础设施**：优先选团队已用的配置中心，适配成本低。
- 本项目配置服务架构高度通用，适配新配置中心仅需补充变量和适配器实现。

---

如需详细代码示例、自动化校验脚本或业务最佳实践，请查阅本目录其它文档或联系维护者。
