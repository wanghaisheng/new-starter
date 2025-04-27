# 数据初始化与存储模式说明

本指南详细说明“纯在线”、“纯离线”、“混合”三种模式下，不同开发/运行阶段如何选择目标数据库与数据来源，并如何进行初始化。适用于 Web、移动端、桌面端等多端一致的数据管理与同步需求。

---

## 一、三种数据存储模式概述

| 模式       | 目标数据库         | 典型场景                  | 是否有本地持久化 | 是否与云端同步 |
|------------|--------------------|---------------------------|------------------|---------------|
| 纯在线     | 云端数据库（如 Supabase、Firebase） | 仅在线业务、强一致性 | 否               | 是            |
| 纯离线     | 本地 IndexedDB/SQLite              | 离线场景、弱网、隐私 | 是               | 否            |
| 混合       | 本地 IndexedDB/SQLite + 云端         | 既要离线也要同步     | 是               | 是            |

---

## 二、不同阶段下的目标数据库与数据初始化来源选择

### 1. 开发/Mock 阶段

- **目标数据库**：
  - 纯在线：可用远程 mock API 或云端测试库
  - 纯离线/混合：本地 IndexedDB/SQLite（推荐 mock/fake-indexeddb）
- **数据来源**：
  - memory（`src/core/lib/db/data/` mock 数据）
  - json 文件（如 `mock-data.json`）
  - sql 文件（如 `mock-sql/*.sql`）
- **初始化方式**：
  - 启动时检测本地存储是否为空，自动导入 mock/json/sql
  - 支持“重置数据”功能，便于调试

### 2. 本地测试/集成阶段

- **目标数据库**：
  - 纯在线：云端测试库
  - 纯离线/混合：本地 SQLite/IndexedDB
- **数据来源**：
  - 推荐 sql 文件（结构与生产一致）
  - 可用 json/mock 数据做补充
- **初始化方式**：
  - 启动时自动执行 sql 脚本建表、导入数据
  - 如有数据迁移，需执行 schema migration

### 3. 生产/线上阶段

- **目标数据库**：
  - 纯在线：正式云端数据库
  - 纯离线/混合：本地 SQLite/IndexedDB
- **数据来源**：
  - sql 文件（结构与生产一致）
  - 云端拉取（首次同步/增量补丁）
- **初始化方式**：
  - 首次启动检查本地是否初始化，无则导入默认数据包或拉取云端数据
  - 混合模式下本地初始化后自动同步云端

---

## 三、标准数据服务接口方法（与实现 src/core/services/data/types/index.ts 保持一致）

```typescript
findById<T>(tableName: string, id: string): Promise<T | null>;
query<T>(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
create<T>(tableName: string, data: T): Promise<T>;
update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
delete(tableName: string, id: string): Promise<void>;
// 批量/事务等扩展方法
createMany<T>(tableName: string, data: T[]): Promise<T[]>;
updateMany<T>(tableName: string, ids: string[], updates: Partial<T>): Promise<number>;
deleteMany(tableName: string, ids: string[]): Promise<number>;
batch(tableName: string, operations: any[]): Promise<void>;
beginTransaction(): Promise<void>;
commitTransaction(): Promise<void>;
rollbackTransaction(): Promise<void>;
// 能力/状态
isInitialized(): boolean;
getStats?(): Promise<any>;
checkHealth?(): Promise<{ healthy: boolean; reason?: string }>;
```
- 所有方法均为泛型，类型安全。
- options、QueryResult<T> 类型详见 data/types。
- update 返回 void；findById 为主接口。

---

## 四、典型初始化流程（伪代码）

```typescript
// 以混合模式为例
async function initializeDbIfNeeded() {
  const hasInitFlag = await dbClient.getMeta('initFlag');
  if (!hasInitFlag) {
    await dataInitializer.initialize(); // 导入 mock/json/sql
    await dbClient.setMeta('initFlag', true);
  }
  // 混合模式下可自动触发云端同步
  if (mode === 'hybrid') {
    await syncManager.syncWithCloud();
  }
}
```

---

## 五、最佳实践与注意事项

- **保持 mock/测试/生产环境的 schema 和数据结构一致**，避免环境切换时出错。
- **本地存储建议加版本号与迁移机制**，如 IndexedDB/SQLite schema migration。
- **数据来源建议统一维护**（mock-data.ts/json/sql），可用脚本自动生成。
- **混合模式建议有同步冲突处理和数据合并策略**。
- **所有业务 service/hooks 统一通过注册表/工厂获取 db client，禁止直连底层实现。**

---

## 六、常见问题

- **如何新增本地 mock 表/数据？**
  - 在 `db/data/` 下增加 mock 文件并聚合导出，或生成 json/sql 文件。
- **如何切换不同模式？**
  - 通过环境变量、配置或构造参数指定。
- **如何保证本地和云端数据一致？**
  - 混合模式下需定期同步，并处理冲突。

---

如需更多高级用法、自动化脚本或具体业务场景示例，请参考项目其他文档或联系架构负责人。
