# 类型定义规范与最佳实践（2025.04 系统升级）

本指南系统性阐述数据库类型定义的设计理念、实践规范、自动化保障和团队协作流程，旨在从定义源头杜绝类型不一致、类型不安全、扩展性差等问题。

---

## 一、设计理念

1. **契约驱动优先**
   - 类型定义以数据库 schema 和业务契约为唯一权威来源，禁止主观臆断字段或类型。
   - 类型、schema、接口文档三者同步演进，任何一方变更需联动 review。

2. **类型安全优先**
   - 所有字段类型必须精确、严谨，优先使用 union type、枚举、泛型等 TypeScript 能力，杜绝 `any`、`string` 滥用。
   - 状态/枚举/布尔等字段，必须用类型系统约束所有可能值。

3. **扩展性与演化友好**
   - 预留 `ext` 字段，所有主类型、聚合类型、创建/更新类型均应支持无侵入扩展。
   - JSON/嵌套结构字段应定义详细类型或接口，避免“黑盒”对象。

4. **单一事实源与去冗余**
   - 项目内所有业务类型定义必须唯一，禁止“影子类型”或重复声明。
   - 业务各层（service、hook、前端等）必须直接 import types 目录类型。

---

## 二、实践规范

1. **类型文件命名与组织**
   - 主类型文件统一为 `xxx.types.ts`，类型定义与实现逻辑严格分离。
   - 所有类型文件、schema 文件命名与表名、业务对象一一对应，便于追溯。

2. **类型结构标准化**
   - 主类型统一继承 `BaseEntity`，包含主键、时间戳等基础字段。
   - 聚合/统计类型、创建/更新类型单独定义，结构清晰、复用性强。
   - 所有 JSON/扩展字段类型必须显式声明结构，避免 `any`。

3. **注释与文档**
   - 每个类型、字段均需补全 JSDoc 注释，说明业务含义、与 schema 的映射、可选性等。
   - 类型定义变更需同步更新说明文档，保持文档与代码一致。

4. **字段类型与可选性严格对齐 schema**
   - schema 字段为非必填时，类型定义必须加 `?` 或 `| undefined`。
   - schema 字段为 JSON 时，类型定义需指定结构或用泛型/接口描述。

5. **状态/枚举统一声明与复用（见 common.ts）**
   - 状态、类型、平台、日志级别等字段，必须统一在 `common.ts` 用枚举（enum）或 union type 声明，并在所有类型中直接复用。
   - 禁止在业务类型中直接写死字符串字面量。
   - 例如：
     ```typescript
     // common.ts
     export enum EntityStatus {
       ACTIVE = 'active',
       INACTIVE = 'inactive',
       PENDING = 'pending',
       APPROVED = 'approved',
       REJECTED = 'rejected',
       SUSPENDED = 'suspended',
     }
     // user.types.ts
     import { EntityStatus } from './common';
     export interface User extends BaseEntity {
       status: EntityStatus;
       // ...
     }
     ```
   - 其它如 DbProvider、SyncStrategy、LogLevel、Platform、AppPlatformEnum 等均在 common.ts 统一声明，禁止重复。

---

## 三、自动化与流程保障

1. **类型/schema 双向检查**
   - 定期（或 PR 阶段）自动化脚本对比 schema 与类型定义，发现不一致及时告警。
   - 类型定义变更需强制走 code review，确保契约同步。

2. **类型生成与约束工具**
   - 推荐使用 schema 驱动的类型生成工具（如 drizzle-kit、zod-to-ts 等）减少人工同步成本。
   - 关键类型、枚举、扩展字段等可用 lint 规则、CI 检查确保规范执行。

3. **团队协作与知识传递**
   - 类型定义规范由专人负责维护，定期组织分享和 review，确保团队成员理解和执行。

---

## 四、类型定义与 schema 对齐 checklist
- [x] 字段名称、类型与 schema 完全对应
- [x] 可选/必填属性与 schema 一致
- [x] JSON/扩展字段结构明确
- [x] 枚举/状态字段类型安全（均统一在 common.ts 声明并复用）
- [x] 注释齐全，说明与 schema 的对应关系

> 如遇特殊 schema 场景（如多语言、动态表、嵌套 JSON），建议先定义范例类型并补充说明文档。

---

## FAQ & 常见问题

- **Q: 为什么所有主类型都要继承 BaseEntity？**
  > 统一主键、时间戳等基础字段，便于全链路一致性和自动化处理。
- **Q: ext 字段是否必须？**
  > 建议所有类型都加，便于未来无侵入扩展。
- **Q: 类型变更如何同步数据库/业务契约？**
  > 需定期对照数据库 schema/业务文档，保持契约同步。
- **Q: 业务 hooks/service 层如何保证类型复用？**
  > 必须直接 import types 目录类型，禁止自定义影子类型。
- **Q: 枚举/状态/平台等通用类型应如何声明？**
  > 必须统一在 common.ts 定义，所有类型引用时直接 import，禁止字符串字面量。

---

> 本文档由数据架构/类型规范 Owner 维护
> 最后更新时间：2025-04-27