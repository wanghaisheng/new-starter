# types 目录整改任务追踪与计划

> 本文件用于追踪和管理 types 目录下所有类型定义整改相关的任务、进度和后续计划，确保类型契约、结构、注释、扩展性等全面达标。

---

## 一、整改目标
- 主类型、聚合/统计类型、创建/更新类型结构标准化，继承 BaseEntity，字段一致。
- ext 字段、注释、命名、聚合类型等补充。
- 与数据库 schema、业务契约、hooks/service 层全链路一致。
- types 目录 README 及注释完善。

---

## 二、任务清单与进度

### 1. 主类型标准化
- [x] BaseEntity 结构与注释梳理
- [x] Photo/Feedback/Message/Match/Notification 主类型继承 BaseEntity，createdAt/updatedAt 必选
- [x] 其他主类型（如 Gift、Settings、Skin、Translation、User 等）继承 BaseEntity，字段一致

### 2. 聚合/统计类型标准化
- [x] PhotoStats/FeedbackStats/MatchStats/NotificationStats 等聚合类型独立声明，结构标准
- [x] 其他业务聚合/统计类型补充与规范

### 3. 创建/更新类型结构化
- [x] PhotoCreate/PhotoUpdate 等创建/更新类型结构化，字段可选并带 ext
- [x] 其他主类型的创建/更新类型梳理与结构化

### 4. 字段与注释规范
- [x] 主类型、聚合类型、创建/更新类型补充 ext 字段
- [x] 字段注释与 JSDoc 规范化
- [x] 其他类型文件补充/完善注释
- [ ] Location 等嵌套类型补充 ext 字段、结构标准化、注释修正

### 5. types 目录 README/文档
- [x] 目录结构说明、类型设计原则、命名规范、扩展建议补充
- [x] 典型用法、最佳实践、FAQ、常见问题说明

### 6. 全链路一致性检查
- [ ] 定期对照数据库 schema/业务文档，保证类型契约同步
- [ ] 推动 hooks/service/仓储层全链路类型复用，禁止影子类型
- [ ] 自动化脚本/工具检查 types 目录类型在 hooks/service/界面层的全量复用情况

---

## 三、后续计划
- Location、Interaction、GlobalConfig 等嵌套/扩展类型补充 ext 字段、结构标准化、注释修正。
- 定期 review types 目录与数据库 schema/业务文档，保持契约同步。
- 开发自动化脚本/工具，检测 hooks/service/界面是否全部复用 types 目录类型。
- 持续完善 types/README.md 和典型用法文档，跟进业务变化及时补充。

---

> 负责人：数据架构/类型规范 Owner
> 更新时间：2025-04-23
