# 数据服务注册表（DataServiceRegistry）

## 作用
- 统一管理所有数据服务实例和工厂，支持懒加载、注销与重建。
- 支持实例的软重置（reset）与资源释放（dispose）。

## 热更新支持
- 注册表本身不自动监听配置变化。
- 推荐由业务层/热更新管理器监听配置服务（ConfigService）变更，主动调用：
  1. unregister(key)：注销并释放旧实例
  2. register(key, factory)：用新配置注册新实例
- 下次 get(key) 时自动懒加载新实例。

## 类型安全与泛型一致性
- 注册表管理的所有实例类型应与工厂/Adapter输出类型一致（如统一为 IDataService<BaseEntity>），保证类型推断和调用一致性。
- 所有注册、获取、注销操作均应有明确的类型签名，避免类型不一致导致的运行时错误。

## 工厂驱动实例化
- 所有实例必须通过 DataServiceFactory 创建，禁止直接 new，保证配置一致性与类型安全。
- 推荐所有配置项通过 ConfigService 统一获取，避免硬编码。

## 多实例/多数据源支持
- 注册表支持多个不同用途的数据服务实例（如主库、日志库、缓存库等），每个实例用唯一 key 管理，满足多业务线/多环境需求。

## 横切能力与扩展
- 注册表可管理聚合型/复合型适配器（如 Hybrid/AdvancedHybrid/CustomCompositeAdapter），支持横切能力和多 provider 组合，便于后续扩展。

## 参考代码
```ts
configService.subscribe('NEXT_PUBLIC_SQLITE_DB_NAME', () => {
  const oldInstance = DataServiceRegistry.get('main-db');
  if (oldInstance?.dispose) oldInstance.dispose();
  DataServiceRegistry.unregister('main-db');
  const newConfig = buildConfigFromService(configService);
  DataServiceRegistry.register('main-db', () => DataServiceFactory.createService(newConfig));
});
```

## dispose/reset 说明
- 推荐所有适配器实现 dispose()，注册表注销时自动释放资源。
- 如需状态软重置，可实现 reset() 并通过 DataServiceRegistry.reset(key) 调用。

---

# English Summary
- The registry manages service lifecycle and enables hot update by unregistering and re-registering instances on config change.

# English Supplement
- All instances managed by the registry should have consistent types as produced by the factory/adapters (e.g., IDataService<BaseEntity>).
- Always instantiate via DataServiceFactory, never direct `new`.
- The registry supports multiple instances for different purposes (main db, log db, cache db, etc.) using unique keys.
- Supports composite/aggregate adapters for cross-cutting concerns and multi-provider scenarios.
