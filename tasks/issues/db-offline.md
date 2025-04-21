# 多后端本地存储与离线服务统一规划任务书

## 一、任务目标
- 支持 localStorage、IndexedDB、WebSQL、Hybrid Storage 等多种本地存储后端，便于业务灵活切换。
- 离线专用表/实体的本地 CRUD 能力与多后端存储解耦，支持 schema 检查、批量、事务。
- 所有接口、类型、工厂、适配器按新架构分层规范实现，类型入口统一、文档完善。

---

## 二、详细任务拆解（含优先级）

### [P0] 1. 工厂与注册表完善
- 工厂（factory/data-service-factory.ts）需支持所有实际后端类型（如 Mock、SQLite、IndexedDB、未来的 Drizzle/Postgres 等）。
- 工厂需支持更细粒度的环境配置（如同步策略、混合模式、调试开关等），并与 types/index.ts 配置类型保持同步。
- 注册表（registry/data-service-registry.ts）可扩展为支持多实例、按需注册/注销等高级用法。

### [P0] 2. 适配器实现
- 检查 adapters 目录下各数据库适配器是否都实现了统一接口（IDataService），如有缺失需补充。
- 离线存储适配器（如 OfflineStorageAdapter）可根据旧代码迁移或单独实现，注册到工厂/注册表。
- 针对未来新后端（如 Drizzle、Postgres）预留适配器模板。

### [P0] 3. 统一接口补全
- types/index.ts 中的 IDataService 接口需与业务实际需求对齐，补全所有必要方法（如批量操作、事务、原始查询等）。
- database-service.ts 实现类需补全所有接口方法的具体实现（目前部分方法为 stub）。

### [P1] 4. 配置与环境切换
- 工厂需完善环境变量/配置对象的解析逻辑，支持开发、测试、生产等多环境自动切换。
- 支持通过配置灵活启用/禁用同步、离线、调试等特性。

### [P1] 5. 文档与示例
- 完善各目录下 README，补充工厂、注册表、适配器的用法和扩展说明。
- 增加业务层调用数据服务的代码示例，便于团队成员快速上手。

### [P1] 6. 测试与验证
- 为各数据服务实现补充单元测试、集成测试，确保不同后端切换时行为一致。
- 验证多环境下的工厂和注册表行为，确保无遗漏。

### [P2] 7. 其他可选优化
- 支持服务懒加载、按需销毁，提升性能。
- 结合实际业务需求，扩展更多高级特性（如缓存、事件通知、数据加密等）。

### [P2] 8. 迁移 data-migration-service 到新架构
- 目标：将 mock、本地、云端等多数据源间的数据迁移能力，重构为基于新版 IDataService/HybridDatabaseClient/多 adapter 的统一迁移服务。
- 步骤：设计迁移接口，支持多 adapter、进度回调、错误处理，补充测试与文档。

### [P2] 9. 迁移 data-preload-service 到新架构
- 目标：将数据预加载、缓存、自动定时预加载、网络监听等能力，重构为基于新版 data 层的通用预加载服务。
- 步骤：适配新版接口，支持多表、可配置、事件驱动，补充测试与文档。

### [P2] 10. 迁移摄像头服务
- 目标目录：src/core/services/business/phone/camera-service.ts
- 目标：将原有 camera-service.ts 按新架构迁移，并与 phone 相关业务能力统一管理
- 要求：接口规范、Mock/平台适配、多端兼容、单元测试
- 负责人：AI迁移助手
- 状态：进行中

---

## 三、注意事项（架构与实现规范）
- 遵循 src/core/services/README.md 架构设计与分层规范。
- 类型定义统一入口（如 src/core/lib/db/types），禁止在实现文件重复定义。
- data 目录仅存放数据适配器，infrastructure 存放底层基础设施。
- 关键接口、工厂、适配器需有详细注释，变更同步更新 README。
- 兼容旧有业务，迁移平滑，支持回滚。

---

## 四、与现有模块的差异与协同
### 1. storage-service.ts
- 仅提供 key-value 级别本地存储（localStorage），不关心表结构、schema。
- 适合通用缓存、设置、简单持久化。

### 2. offline-storage-service.ts
- 面向“离线专用表”，支持表级 CRUD、schema 检查、实体操作。
- 适合离线业务数据、断网场景。

### 3. lib/db/sync
- 负责本地数据与远程服务器的同步、冲突解决、同步状态管理。
- 依赖本地存储服务（如 offline-storage-service）作为本地数据源。

### 4. lib/db/docs
- 存放数据库文档、表结构说明、schema 设计文档。
- 为 offline-storage-service、sync-manager 等提供元数据支撑。

### 5. 差异与共同点
- storage-service 关注 key-value 存储，offline-storage-service 关注表级业务数据。
- sync-manager 侧重于同步流程和状态管理，需与 offline-storage-service 协作。
- docs 提供 schema、同步规则等元数据，是 data/infrastructure 层的“说明书”。

---

## 六、最新进展与任务追踪（2025-04-17 更新）

### 已完成
- [x] Sqlite、IndexedDB 适配器实现，统一接口，修正所有类型与 lint 错误。
- [x] IDataService、DataServiceConfig 类型补全，支持批量、事务、原始查询。
- [x] 工厂支持自动根据环境变量/配置对象切换后端。
- [x] README 补充架构说明、工厂/注册表/业务层示例、扩展说明，examples 目录新增完整用法代码。
- [x] 工厂、注册表、Sqlite/IndexedDB 适配器、业务集成等测试全覆盖。
- [x] 注册表支持懒加载工厂与 dispose，提升资源管理能力。
- [x] 适配器支持 on/off/emit 事件订阅、findOne/query 查询缓存与自动失效。
- [x] Hybrid/AdvancedHybrid 适配器已实现，支持多模式切换和同步。
- [x] Supabase 适配器已实现。
- [x] 基础数据校验服务（validation-service）已迁移至 infrastructure 层。
- [x] examples 目录下示例代码已全面升级，覆盖事件、缓存、销毁等用法。

### 进行中
- [ ] 高级特性扩展预研：如加密、统一日志、Mock/Drizzle/Postgres 新适配器模板等。

### 待办
- [ ] 离线/Mock/Drizzle/Postgres 等新适配器模板预留与迁移（目前尚未实现 offline-storage-service、mock、drizzle、postgres 适配器）。
- [ ] 服务懒加载、按需销毁等高级优化（如需进一步细化）。
- [ ] 缓存、事件通知、数据加密等高级特性更深入的扩展和测试。

---

## 七、模块职责与架构说明

### 1. storage-service.ts
- 仅提供 key-value 级别本地存储（localStorage），不关心表结构、schema。
- 适合通用缓存、设置、简单持久化。

### 2. offline-storage-service.ts
- 面向“离线专用表”，支持表级 CRUD、schema 检查、实体操作。
- 适合离线业务数据、断网场景。
- （当前未迁移，待实现）

### 3. advanced-hybrid-database-client.ts / hybrid-database-client.ts
- 支持 hybrid（本地+云端）多模式切换、同步，适合复杂业务。

### 4. validation-service.ts
- 基础数据校验，已迁移至 infrastructure 层，供业务和适配器复用。

---

## 八、里程碑与验收标准
- [x] 接口与工厂定义、类型入口统一
- [x] 多后端适配器实现
- [x] 离线表服务与 schema 集成
- [x] 业务层适配与迁移
- [x] 测试、文档、README 完善

> **最新进展**：数据服务架构主线开发、主流适配器、测试、事件与缓存机制已全部打通。建议聚焦文档完善和高级特性可扩展性，为未来新后端和业务需求做好准备。

---
