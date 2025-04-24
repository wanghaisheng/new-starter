# 数据库类型定义指南

本文档详细说明了如何在项目中新增和维护数据库表类型定义，包括类型定义的标准格式、命名规范、扩展建议、最佳实践，以及如何与表结构定义和业务契约关联。本指南旨在确保项目中的数据库类型定义保持一致性、可维护性和可扩展性。

---

## 目录结构与命名规范（2025.04 修订）

### 1. 命名规范
- 所有纯类型定义文件统一命名为 `xxx.types.ts`，如 `user.types.ts`、`match.types.ts`、`settings.types.ts`。
- 不再使用 `xxx.ts` 作为类型定义文件名，避免实现与类型混杂。
- 工具/适配器/聚合文件可用 `xxx.ts`、`xxx.util.ts`、`xxx.adapter.ts` 等。

### 2. 目录结构示例

```
db/types/
├── base-entity.ts
├── gift.types.ts
├── global-config.types.ts
├── interaction.types.ts
├── location.ts
├── match.types.ts
├── member-growth-task.types.ts
├── member-growth.types.ts
├── message.types.ts
├── notification.types.ts
├── photo.types.ts
├── quiz.types.ts
├── settings.types.ts
├── skin.types.ts
├── translation.types.ts
├── user.types.ts
├── ...
```

---

## 类型设计原则

1. **主类型统一继承 BaseEntity**
   - 包含 `id`、`createdAt`、`updatedAt` 等基础字段，所有主类型必须继承，保证一致性。
2. **聚合/统计类型独立声明**
   - 如 `UserStats`、`PhotoStats`、`GiftStats` 等，结构标准，便于报表和分析。
3. **创建/更新类型分离**
   - 如 `UserCreate`、`UserUpdate`，仅包含业务所需字段，便于接口参数校验和复用。
4. **ext 字段统一**
   - 所有主类型、聚合类型、创建/更新类型建议均带有 `ext?: Record<string, any>` 字段，便于扩展。
5. **注释与 JSDoc 规范**
   - 所有类型、字段均需补全注释，便于团队理解和自动生成文档。
6. **禁止影子类型**
   - hooks/service/仓储/前端等层均须直接 import types 目录类型，禁止自定义“影子类型”。

---

## 典型用法与最佳实践

- **主类型定义示例**
  ```typescript
  export interface User extends BaseEntity {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    ext?: Record<string, any>;
  }
  ```
- **聚合/统计类型定义示例**
  ```typescript
  export interface UserStats {
    total: number;
    active: number;
    ext: Record<string, any>;
  }
  ```
- **创建/更新类型定义示例**
  ```typescript
  export interface UserCreate {
    name: string;
    email: string;
    ext?: Record<string, any>;
  }
  export interface UserUpdate {
    name?: string;
    email?: string;
    ext?: Record<string, any>;
  }
  ```

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

---

## 扩展建议

- 类型定义如需支持多端（Web/移动端/服务端），建议统一放在 types 目录，避免重复维护。
- 新增类型时请严格遵循本指南命名、结构、注释规范。
- 定期 review 目录结构和类型契约，发现冗余或不一致及时整改。

---

> 本文档由数据架构/类型规范 Owner 维护
> 最后更新时间：2025-04-23