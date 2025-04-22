# 服务设计规范（Service Design Guidelines）

> 本文档为 HeyTCM 项目所有服务层（business/data/client/infrastructure 等）统一的设计规范，供各子目录 README 引用，避免重复维护。

---

## 详细服务设计规范（可复用细节汇总）

### 1. 插件化注册表 + 工厂 + 适配器架构（强制要求）
- 所有服务（业务、数据、基础设施、客户端等）**必须采用“插件化注册表 + 工厂 + 适配器 + 接口”分层模式**。
- **服务实例只能通过注册表（Registry）获取，禁止直接 new/Factory/Adapter 直连。**
- 支持多 provider/多实例/动态扩展/运行时注册，满足 mock/remote/品牌定制/灰度等多场景。
- hooks/页面/业务层只能通过注册表注入服务，便于 mock、扩展和统一管理。
- 注册表层应内置实例缓存，确保每类服务全局唯一（单例），避免重复创建和资源浪费。
- 支持运行时注册新 Adapter，满足插件化、A/B 测试、品牌定制等需求。

### 2. 统一接口与类型安全（必须具体落实）
- 所有服务接口建议以 `IService`、`IDataService`、`ILoggerService`、`INotificationService` 等形式命名，类型定义集中在 `types/` 目录。
- 推荐所有接口定义集中在 `types/` 目录，并在 registry/factory 层用泛型约束暴露能力。
- 服务注册表（Registry）对外暴露的获取服务实例方法必须统一签名，推荐如下：
  ```typescript
  getProvider(
    type: string,         // provider 类型（如 mock/remote/brandA/brandB）
    name?: string,        // 实例名，默认 'default'
    dataService?: any,    // 可选注入，部分服务如 Match 需注入数据服务
    options?: object      // 其它扩展参数，预留
  ): () => IService
  ```
  或
  ```typescript
  getService(name?: string, options?: object): IService
  ```
- hooks/页面/业务层**只能通过注册表暴露的统一接口获取服务实例**，严禁直接调用工厂、适配器或 new。
- 所有服务实例必须满足接口类型约束，便于类型推断、自动补全和团队协作。

#### 常用接口方法签名（推荐标准）
- **初始化与销毁**
  ```typescript
  initialize(config?: object): Promise<void>;
  destroy?(): Promise<void>;
  ```
- **数据服务/资源服务标准 CRUD**
  > 建议统一采用 `findOne(tableName, id)`，而非 `findById`，以便支持多表和灵活扩展。
  ```typescript
  findOne<T extends { id: string }>(tableName: string, id: string): Promise<T | null>;
  query<T>(tableName: string, options?: any): Promise<T[]>;
  insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T>;
  update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(tableName: string, id: string): Promise<void>;
  ```
- **批量与事务（如需）**
  ```typescript
  batch(actions: Array<{ type: string; payload: any }>): Promise<any[]>;
  transaction(actions: Function[]): Promise<void>;
  ```
- **通用状态/能力方法**
  ```typescript
  isAvailable(): boolean | Promise<boolean>;
  getStatus?(): ServiceStatus;
  ```

#### 类型安全与泛型
- 所有服务、工厂、注册表建议用泛型约束返回值和参数类型，提升类型推断和开发体验。
  ```typescript
  interface IDataService<T> { /* ... */ }
  class DataServiceRegistry<T> { /* ... */ }
  ```

#### 典型接口模板（可直接引用）
```typescript
export interface IUserService {
  initialize(config?: object): Promise<void>;
  getUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  // ...
}

export interface IDataService {
  findOne<T extends { id: string }>(tableName: string, id: string): Promise<T | null>;
  query<T>(tableName: string, options?: any): Promise<T[]>;
  insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T>;
  update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(tableName: string, id: string): Promise<void>;
}

export interface IServiceRegistry<T> {
  getProvider(type: string, name?: string, options?: object): () => T;
}

### 3. 返回值与状态输出规范
- **所有服务与 hooks 返回值必须统一包含 `loading`、`error`、`empty` 字段。**
- error 字段需细化为分类型（如 network、auth、validation 等），不得返回 string/number。
- 推荐标准结构：
  ```typescript
  {
    loading: boolean;
    error: { type: 'network' | 'auth' | 'validation' | string; message: string } | null;
    empty: boolean;
    data: T | null;
  }
  ```
- 页面/组件只能消费统一结构，便于 UI 友好渲染和异常兜底。
- 禁止页面/组件直接 try/catch service 抛出的 string/number。
- 所有异常必须通过统一的 error 字段返回，由 hooks/服务内部捕获和分型。
- 详细 error 处理约定请参考 `docs/guides/architecture/service-error-handling.md`。

### 4. 生命周期与测试用例
- 注册表/工厂层必须保证实例全局唯一，支持 reset/clear 便于测试隔离。
- 每个服务和 hooks 必须有标准接口文档和典型用法测试用例。
- 评审/CI 必须检查是否严格遵循本规范。

### 5. 目录结构与命名规范
- 推荐目录结构：types/、adapters/、factory/、registry/、service.ts。
- 所有注册表统一命名为 `xxx-service-registry.ts`，工厂为 `xxx-service-factory.ts`。

### 6. 适用范围与引用方式
- 本规范适用于 business、data、client、infrastructure 等所有服务层，团队所有新老成员必须严格对齐，否则视为不合规代码。如有特殊需求，需架构组评审豁免。
- 推荐各子目录 README 通过如下方式引用本规范：
  ```markdown
  > 详细服务设计规范请参考 [../service-design-guidelines.md](../service-design-guidelines.md)
  ```

### 7. 性能优化、安全性与日志监控（强制与推荐细则）

#### 性能优化
- 所有服务应根据场景选择合适的缓存策略（如内存缓存、IndexedDB、本地存储等），并明确缓存失效机制。
- 支持批量操作接口（如 batch、bulkInsert），减少多次请求，提升吞吐。
- 所有耗时操作（如网络/数据库）均应为异步 Promise，并提供 loading 状态。
- 对大数据量操作建议分页、懒加载或流式处理，避免阻塞。
- 并发控制：如必要可引入队列、信号量等机制，防止资源争用。
- 资源管理：服务需在销毁时释放连接、句柄等资源，避免泄漏。

#### 安全性
- 所有服务接口必须进行输入参数校验（类型、范围、必填项等），防止注入和脏数据。
- 关键操作需权限校验（如用户身份、角色、token），严禁未授权访问。
- 敏感数据（如密码、token、手机号等）必须加密存储和传输。
- 支持 API 密钥管理、请求限流、访问控制等安全措施。
- 推荐使用统一的安全工具库或中间件，避免重复造轮子。

#### 日志与监控
- 重要操作、异常、性能瓶颈等应有结构化日志（如 info/warn/error），便于追溯和分析。
- 日志内容应包含服务名、方法、参数、异常堆栈等关键信息。
- 所有服务必须通过统一的 LoggerService 记录日志，禁止直接 console.log。
- 服务应在关键流程、分支、异常捕获等处主动调用 LoggerService，帮助问题定位和性能分析。
- LoggerService 应支持多级别（info/warn/error/debug）、可扩展输出（本地/远程/监控平台等）。
- 支持埋点、监控扩展，便于后期分析和预警。

#### 数据处理与恢复
- 所有输入数据应进行验证和清理，输出数据需标准化格式。
- 错误恢复机制：服务应能捕获并处理常见异常，必要时自动重试或降级。

### 8. 业务服务分层与特殊约定

#### 业务服务分层架构
- 所有业务服务（如消息、用户、认证、支付、设备等）采用统一的 provider/adapter/options 分层架构，便于多端适配、扩展与测试。
  - **Provider**：主实现类型（如 remote、local、mock、web、capacitor、thirdparty 等），决定业务服务的运行环境或主后端。
  - **Adapter**：具体实现 provider 的适配器，负责实际的 API 调用、数据处理等（如 RemoteMessageServiceAdapter、WebSensorAdapter）。
  - **Options**：灵活扩展参数（如 brand、apiBaseUrl、featureFlag、环境变量等），用于 adapter 内部差异化处理。
  - **Factory/Registry**：统一注册和获取服务实例，支持自动降级、mock 等。

#### 目录结构与命名
- 每个业务模块分为 factory、adapters、types、service、api、worker 等子目录，保持分层清晰。
- 所有类型定义统一放在 types 子目录。

#### 重要注意事项
- hooks/页面严禁直接实例化 Service/Adapter，必须通过注册表方法获取实例。
- 工厂方法签名、适配器参数风格、注册表机制保持全局统一，便于维护和扩展。
- 如遇特殊业务无 mock/remote/hybrid 类型，需说明原因并保持接口一致。
- 详细实现可参考 `match/factory/match-service-factory.ts` 与 `hooks/useMatches.ts`。

### 9. 数据服务模式与环境适配

- 数据服务支持三种核心模式：纯在线（Online Only）、纯离线（Offline Only）、混合（Hybrid）。
  - **纯在线**：仅依赖云端数据库（如 Supabase、远程 SQLite），适合生产环境、强一致性场景。
  - **纯离线**：仅依赖本地数据库（IndexedDB、Capacitor SQLite、MockClient），适合 mock、本地开发、断网场景。
  - **混合**：本地与云端并存，自动切换/同步，断网时本地可用，联网后自动同步。
- 各开发阶段推荐模式：
  | 阶段       | 推荐模式   | Adapter/实现                  | 说明                              |
  |------------|------------|-------------------------------|-----------------------------------|
  | mock       | 纯离线     | mock-database-client          | 零配置自动 mock，开发体验最佳      |
  | local      | 离线/混合  | indexeddb/sqlite/hybrid       | 支持本地存储，部分表可混合同步      |
  | dev        | 混合/在线  | hybrid/supabase/sqlite        | 支持断网、自动降级、数据同步        |
  | production | 混合/在线  | hybrid/supabase/sqlite        | 云端为主，断网自动降级本地，自动同步 |
- 环境变量（如 `MOCK_DB_MODE`、`ONLINE_DB`、`OFFLINE_DB`）决定工厂/注册表选择哪种 adapter。
- 工厂/注册表应根据环境自动选择最优 adapter 并支持热切换。

### 10. 基础设施服务分层与实现规范

- 基础设施服务（infrastructure）负责与外部系统、第三方服务、平台能力的集成和适配，专注于技术实现和环境抽象。
- 推荐目录结构：每个 provider（如 logger、network、email、config 等）均采用 adapters/factory/registry/service/types/index.ts 结构，便于扩展和 mock。
- 业务层禁止直接 new/factory，统一通过 registry 获取服务实例。
- types.ts 只做类型聚合，不存具体实现。
- 所有注册、获取、注销、销毁操作应有日志记录，便于排查问题（建议统一用 LoggerService 记录）。
- 基础设施服务应支持 mock、自动降级、环境切换等能力，便于开发和测试。

### 11. AI 服务设计与实现建议

- **SDK 集成**：支持多种 SDK 选择，统一接口封装，错误处理与重试机制，性能监控与优化。
- **模型管理**：模型版本控制、切换策略、性能监控、成本优化。
- **数据处理**：输入验证与清理，输出格式标准化，数据缓存策略，错误恢复机制。
- **性能优化**：请求批处理、响应缓存、并发控制、资源管理。
- **安全考虑**：API 密钥管理、请求限流、数据加密、访问控制。

### 12. Mock 阶段 Adapter 设计最佳实践（2025 更新）

- mock 阶段建议服务注册表/工厂**默认只注册极简内存型 mock adapter**，保证开发体验极致简单。
- 该 adapter 数据仅存于内存，适合接口/schema 联调、UI 流程自测，**刷新页面或重启应用数据会丢失**。
- 如需“真实 app”体验（如演示、深度交互测试）或自动化测试，可扩展持久化 mock adapter（如 json、localStorage、IndexedDB），但主流程不强制依赖。
- 推荐：
  - Web 端可选 localStorage/IndexedDB mock adapter
  - Node 环境可选 json 文件 mock adapter
- 注册表/工厂应保持灵活性，允许后续 adapter 动态注册，方便扩展和测试。
- 文档、注释、README 中应明确 mock adapter 策略，避免误用。

---

> 以上规范内容已汇总自 business、client、data、infrastructure 各 README 及最佳实践，供全员参考与复用。
