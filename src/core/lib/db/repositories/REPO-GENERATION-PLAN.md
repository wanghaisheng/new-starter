# 仓储与测试手动生成计划

## 目标
为 src/core/lib/db/types 下所有主实体类型，手动生成标准仓储接口、适配器实现和单元测试，保证类型安全、可扩展和高可测性。

## 步骤

1. **梳理实体类型**
   - 明确每个主类型的主键、唯一/索引字段。

2. **定义仓储接口**
   - 继承 IBaseRepository<Entity>。
   - 为唯一/索引字段补充 findByXxx 方法。

3. **实现仓储适配器**
   - IndexedDB/SQLite 各写一个适配器，继承通用基类。
   - 实现所有接口方法。

4. **实现 impl 层仓储**
   - 继承 BaseRepository<Entity>，实现接口方法。
   - 注册到 RepositoryFactoryRegistry。

5. **补充单元测试**
   - 参考 user 测试，覆盖 CRUD、findByXxx、异常分支。
   - 使用 mock client，保证测试隔离。

6. **文档与规范**
   - 记录命名、目录结构、测试模板等规范。

## 经验教训
- 接口与实现分离，便于多端适配和 mock 测试。
- 工厂注册统一，便于切换存储方案。
- 可扩展性强，支持实体特有方法。
- 测试独立性，mock/fake client 必须完善。
- 类型安全，所有方法严格类型约束。

## 推荐目录结构

- repositories/types/entity-repository.types.ts
- repositories/adapters/entity-repository-indexeddb.ts
- repositories/adapters/entity-repository-sqlite.ts
- repositories/impl/entity-repository.ts
- testing/entity-repository.test.ts

## 示例参考
详见 user 仓储与测试实现。
