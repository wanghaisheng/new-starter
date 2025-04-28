# quiz 业务服务迁移

本目录为 quiz（测评/问卷）服务新实现，遵循类型安全、分层清晰、插件化适配器架构。

## 目录结构建议
- types/  类型定义与接口
- service/  核心业务逻辑
- adapters/  数据/AI/报告等适配器
- registry/  服务注册表
- factory/  工厂方法
- __tests__/  单元测试

## 迁移注意事项
- 保证所有类型定义均在 types/ 下集中管理
- 业务逻辑与适配器解耦，便于扩展
- 迁移完成后同步更新 MIGRATION_TASKS.md
- 逐步淘汰 deprecated/quiz 目录下旧实现

## 进度记录
- 2024-迁移初始化