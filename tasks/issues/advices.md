# 实现与架构设计差异分析与建议

本报告对比了 `docs` 目录下的架构设计文档与 `app`、`src` 目录下的实际实现，分析了主要差异，并给出优化建议。

---

## 1. 架构设计文档摘要

- 分层架构：UI组件层 → 服务层 → 数据访问层 → 存储层。
- 数据与服务：
  - 数据服务统一接口（`IDataService`），多实现（Mock、SQLite、IndexedDB等）。
  - 数据库客户端、仓储（repository）、schema、service分层。
- 存储策略：Mock、Web离线（IndexedDB）、移动端（SQLite）、云端（Firebase/Supabase）。
- 同步策略：在线优先、离线优先、手动同步、本地永不上传。
- 领域服务：UserService、MessageService 等。

## 2. 实际实现摘要

- 目录结构基本符合设计（`src/core/lib/db/clients|repositories|schema|service.ts`等完整）。
- 多种数据服务实现，接口定义分布于 `interfaces.ts`、`data-service-interface.ts`、`data-service.ts`，存在一定重复与风格不统一。
- 实现细节：
  - 数据服务工厂（`DataServiceFactory`）可根据环境动态切换 Mock/SQLite/云端等。
  - 领域服务（如 `UserService`、`MatchService`、`MessageService`）依赖于数据服务接口。
  - 数据库 schema 设计完善，支持多环境。
- 实现中部分接口命名、参数与设计文档不完全一致。
- 有部分旧实现/迁移遗留（如 services 目录、部分接口冗余）。

## 3. 差异与问题分析

1. **接口定义分散且风格不一**：
   - `IDataService` 在多个文件中有不同版本，建议统一到一处，保持风格一致。
2. **部分服务/工厂实现与文档描述略有出入**：
   - 设计文档强调“服务工厂”与“离线服务”分离，实际实现有部分功能耦合。
3. **领域服务依赖注入方式不统一**：
   - 有的通过工厂注入，有的直接实例化，建议统一依赖注入方式。
4. **部分目录/文件冗余**：
   - 如 `services` 与 `services/data` 下有类似实现，建议合并或清理。
5. **同步策略实现未完全落地**：
   - 设计文档有详细同步策略，实际代码中 SyncManager 相关实现有待补全。
6. **schema/models/实体定义有重复**：
   - `core/models`、`core/lib/db/models` 与 `schema` 有交叉，建议只保留一套权威数据模型。

## 4. 优化建议

1. **接口统一**：
   - 合并并规范所有 `IDataService` 及相关接口，集中定义，避免多处分叉。
2. **服务工厂与同步分离**：
   - 明确 DataServiceFactory 只负责数据服务实例化，同步逻辑独立到 SyncManager。
3. **领域服务依赖注入标准化**：
   - 推荐采用工厂/配置注入，便于测试与扩展。
4. **目录结构优化**：
   - 清理冗余目录（如 services），所有服务实现集中到 `services/data`。
5. **同步功能完善**：
   - 按设计文档补全 SyncManager 及其策略实现，确保 Mock/本地/云端环境下行为一致。
6. **数据模型唯一化**：
   - 统一数据实体定义，schema、models 保持同步，防止重复和不一致。
7. **文档与代码同步**：
   - 定期根据实现更新架构设计文档，保持文档与实际一致。

---

如需详细差异点清单或具体代码整改建议，可进一步细化分析。
