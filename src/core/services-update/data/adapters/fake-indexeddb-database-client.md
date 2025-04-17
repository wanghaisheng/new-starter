# FakeIndexedDBDatabaseClient 说明

## 作用与定位

- 纯内存 IndexedDB mock 实现，适合测试、开发、mock 环境。
- 也可作为高性能缓存层，与主数据库（如 Hybrid/Sqlite/Supabase）组合，提升读写性能。

## 主要特性

- **纯内存实现**：所有数据存储在 JS 对象中，无需实际 IndexedDB 依赖。
- **作为缓存层**：实现 getCache/setCache/hasCache 方法，便于本地优先缓存、内存加速等高级场景。
- **完整 CRUD 支持**：findOne/query/insert/update/delete，自动触发事件与缓存失效。
- **事件与缓存机制**：继承 BaseDatabaseClient，支持 on/off/emit、cacheInvalidate、cacheClear。

## 用法示例

### 1. 作为 mock 数据库（测试/开发环境）
```ts
const fakeDb = new FakeIndexedDBDatabaseClient(config);
await fakeDb.insert('users', { id: 'u1', name: 'test' });
const user = await fakeDb.findOne('users', 'u1');
```

### 2. 作为缓存层（主服务组合）
```ts
// 查询时优先查缓存
if (fakeDb.hasCache('users', 'u1')) {
  return fakeDb.getCache('users', 'u1');
}
// 若无缓存则查主库，并写入缓存
const user = await mainDb.findOne('users', 'u1');
fakeDb.setCache('users', 'u1', user);
```

## 高级用法建议

- 可集成到 HybridDatabaseClient，实现多级缓存、自动失效、本地优先等高级场景。
- 支持事件监听，可用于 UI 同步、缓存命中统计等。
- dispose/clear 可用于测试 teardown 或缓存重置。

---
如需进一步集成或高级用法示例，请参考主项目文档或联系架构负责人。
