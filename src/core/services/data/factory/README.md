# 数据服务工厂（DataServiceFactory）

## 作用
- 统一负责各类数据库服务（如 Hybrid/AdvancedHybrid/单一 provider）的动态实例化。
- 支持配置自动注入与多 provider、多缓存层、同步等高级场景。
- 工厂本身不负责热更新，而是由外部注册表/配置服务驱动实例的重建。

## 配置自动注入
- 工厂通过参数和环境变量自动注入 provider、cache、sync 策略等配置。
- 推荐所有配置项通过配置服务（ConfigService）统一获取，避免魔法字符串。

## 类型安全与泛型规范
- 所有 Adapter/Client/工厂方法的泛型参数必须与 `IDataService<T>` 保持一致，推荐统一为 `BaseEntity`。
- 工厂方法如 `createBaseClient`、`DataServiceFactory.createService` 的返回类型建议补全为 `IDataService<BaseEntity>`，保证类型推断和调用一致性。
- 新增/自定义 Adapter（如 CustomCompositeAdapter）也应 implements `IDataService<BaseEntity>` 并补全所有方法签名类型。

## Adapter 注册与实例化最佳实践
- 所有 Adapter/Client 必须通过注册表（ClientRegistry）+ 工厂（DataServiceFactory）组合实例化，禁止直接 new。
- 推荐所有配置项通过 ConfigService 统一获取，避免硬编码。

## 支持热更新的最佳实践
- 工厂本身不监听配置变化。
- 热更新应由注册表和配置服务协作完成：
  1. 监听配置服务的关键配置项变更。
  2. 注销旧实例（DataServiceRegistry.unregister）。
  3. 用新配置调用工厂重建实例并注册。

## 横切能力与扩展建议
- 如需全局 KV、分布式锁、缓存一致性等横切能力，可通过工厂注入 hooks 或中间件实现。
- 聚合型适配器（如 CustomCompositeAdapter）支持多 provider 组合、横切逻辑注入。

## 资源释放建议
- 适配器应实现 dispose() 方法，工厂重建时自动释放旧资源。

## 参考代码
```ts
configService.subscribe('NEXT_PUBLIC_SQLITE_DB_NAME', () => {
  DataServiceRegistry.unregister('main-db');
  const newConfig = buildConfigFromService(configService);
  DataServiceRegistry.register('main-db', () => DataServiceFactory.createService(newConfig));
});
```

---

# English Summary
- The factory is responsible for dynamic service instantiation and config injection.
- Hot update is achieved by external registry/config service, not by the factory itself.

# English Supplement
- All adapters and factory methods must use the same generic parameter as `IDataService<T>`, preferably `BaseEntity`.
- Always instantiate adapters/clients via registry + factory, never direct `new`.
- For cross-cutting concerns, inject hooks/middleware via the factory.
