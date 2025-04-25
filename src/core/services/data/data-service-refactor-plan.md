# 数据服务解耦与注册表工厂模式全面重构方案（2025）

---

## 一、改造目标

- 实现数据服务（DataService）全链路解耦：配置服务、工厂、注册表、适配器分层清晰，支撑 Mock/本地/云端/混合多环境无缝切换。
- 统一业务层、仓储层、hooks 的数据访问入口，禁止直接 new，全部通过注册表和工厂获取实例。
- 支持插件化、A/B 测试、Mock 自动降级、环境参数动态注入。
- 提升架构可扩展性、可维护性和测试友好性。

---

## 二、最新分层与职责梳理

### 1. 配置服务（ConfigService）
- 统一管理所有环境变量和运行参数。
- 仅通过 config-keys.ts 定义和访问所有 key，禁止硬编码。
- 支持多端（Web/Mobile）、多 provider、动态切换。
- 关键变量包括：
  - `NEXT_PUBLIC_NODE_ENV`、`NEXT_PUBLIC_ENV_STAGE`
  - `NEXT_PUBLIC_DATA_MODE`（online/offline/hybrid）
  - `NEXT_PUBLIC_ONLINE_DB_PROVIDER`、`NEXT_PUBLIC_OFFLINE_DB_PROVIDER`
  - `NEXT_PUBLIC_DB_ORM`

### 2. 工厂（DataServiceFactory）
- 负责根据配置服务动态选择和实例化适配器。
- 支持 Mock、本地、云端、混合等多 adapter 动态切换。
- 内部先判断环境阶段，再判断数据模式，最后根据模式选择具体 provider。
- 新增/扩展 provider 只需实现 adapter 并注册，无需改动工厂主逻辑。
- 推荐用法：

```ts
import { DataServiceFactory } from './factory/data-service-factory';
const dataService = DataServiceFactory.createService();
```

### 3. 注册表（DataServiceRegistry）
- 全局唯一注册、获取和管理数据服务实例，支持懒加载和实例缓存。
- 支持按需销毁、注销、热切换（switchAdapter），并记录详细日志。
- 业务层、仓储层、hooks 统一通过注册表获取实例，禁止直接 new。
- 推荐用法：

```ts
import { DataServiceRegistry } from './registry/data-service-registry';
DataServiceRegistry.register('default', () => DataServiceFactory.createService());
const dataService = DataServiceRegistry.get('default');
```

### 4. 适配器（Adapters）
- 每种 provider/模式一个 adapter，职责单一，易扩展。
- 支持 Mock、Sqlite、Supabase、IndexedDB、Hybrid 等。
- HybridAdapter 支持断网切换、同步等高级能力。
- 仅实现 provider 适配器与聚合/高级策略适配器，避免“表 × provider”重复实现。
- 目录建议：

```
src/core/services/data/adapters/
  mock-database-service-adapter.ts
  sqlite-database-service-adapter.ts
  supabase-database-service-adapter.ts
  indexeddb-database-service-adapter.ts
  hybrid-database-service-adapter.ts
  advanced-hybrid-database-service-adapter.ts
```

---

## 三、核心调用链与配置驱动选择机制

1. **配置服务统一读取所有环境变量**，如 `NEXT_PUBLIC_DATA_MODE`、`NEXT_PUBLIC_ONLINE_DB_PROVIDER` 等。
2. **工厂根据配置动态实例化对应 adapter**，如 hybrid/online/offline/mock。
3. **注册表注册工厂或实例，业务层仅通过注册表获取实例**，实现全局唯一、懒加载、可热切换。
4. **所有实例创建、切换、销毁、异常均有详细日志**，便于多环境排查。
5. **禁止业务层/仓储层直接 new，禁止硬编码环境变量。**

---

## 四、典型代码示例

```ts
// 1. 注册表+工厂自动注册
import { DataServiceRegistry } from './registry/data-service-registry';
import { DataServiceFactory } from './factory/data-service-factory';
DataServiceRegistry.register('default', () => DataServiceFactory.createService());

// 2. 业务/仓储层统一获取实例
const dataService = DataServiceRegistry.get('default');

// 3. 热切换/重建
DataServiceRegistry.switchAdapter('default', () => DataServiceFactory.createService(newConfig));
```

---

## 五、分步实施计划与优先级

### 1. 配置服务集中管理与环境参数梳理
- 所有环境变量和 key 统一 config-keys.ts 管理，工厂/注册表/适配器均通过 ConfigService 获取。

### 2. 工厂统一实例化与适配器选择逻辑完善
- DataServiceFactory 内部根据配置服务动态选择 adapter。
- 支持 Mock、本地、云端、hybrid，便于扩展。

### 3. 注册表全局唯一实例获取与热切换能力
- DataServiceRegistry 支持懒加载、实例缓存、按需销毁、热切换。
- 所有业务/仓储层均通过注册表获取实例。

### 4. 类型约束、幂等性与生命周期管理
- 数据服务实例需暴露已初始化状态，初始化幂等。
- 注册表/工厂支持实例销毁与重建，避免内存泄漏。

### 5. 健康检查、异常上报与自动化测试
- 内置健康检查与异常上报，便于监控。
- 自动化测试覆盖多环境、多 provider、mock 自动降级、生命周期等。

### 6. 文档、最佳实践同步
- README.md、adapters/README.md、factory/registry 代码注释与调用链示例同步更新。
- 强调 config-keys.ts 管理 key，禁止硬编码。

---

## 六、最佳实践与注意事项

- **新增/变更 provider 或环境变量需同步所有相关配置和文档。**
- **多端/PWA 场景下建议详细测试 provider 切换、离线恢复、同步冲突等边界。**
- **所有环境变量 key 统一通过 config-keys.ts 管理，禁止硬编码。**
- **注册表+工厂+适配器为唯一推荐调用链，禁止直接 new。**

---

## 七、进度追踪与当前状态（2025-04-25 更新）

- [x] 配置服务集中管理与环境参数梳理
- [x] 工厂统一实例化与适配器选择逻辑完善
- [x] 注册表全局唯一实例获取与热切换能力
- [x] 与 hooks/仓储层的类型契约梳理与接口规范
- [x] 初始化状态标志与幂等性机制实现
- [x] 仓储层与数据服务解耦与依赖注入
- [x] adapter/provider 热插拔与资源释放
- [x] 服务实例生命周期管理（销毁/重建/重置）
- [x] 健康检查与异常上报机制
- [x] 自动化测试与回归保障（多环境、多 provider，含注册表、健康检查、生命周期等核心能力全覆盖）
- [ ] 文档、最佳实践、FAQ、调用链与配置示例同步（持续完善中）

---

> 详见 [data/README.md](./README.md)、[adapters/README.md](./adapters/README.md)、[factory/data-service-factory.ts](./factory/data-service-factory.ts)、[registry/data-service-registry.ts](./registry/data-service-registry.ts) 及相关代码注释。
> 
> 本方案为数据服务分层解耦、全局唯一实例管理、多 provider/多环境/多端适配的权威实施指引，团队开发与维护前请务必通读。
