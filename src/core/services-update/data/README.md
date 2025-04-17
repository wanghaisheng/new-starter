# 数据服务设计文档

## 设计目标

- 提供统一的数据访问接口，屏蔽底层实现细节。
- 支持多种数据库后端（如 SQLite、IndexedDB、Mock 等），可根据环境灵活切换。
- 采用工厂、注册表、适配器等模式，保证架构解耦、可扩展、易维护。

---

## 目录结构

```
src/core/services-update/data/
├── adapters/      # 数据库适配器（如 IndexedDB、SQLite 等）
├── factory/       # 数据服务工厂（动态创建服务实例，根据配置选择后端）
├── registry/      # 数据服务注册表（统一管理服务实例，解耦获取方式）
├── types/         # 类型定义（接口、配置、类型约束等）
├── database-service.ts # 数据服务统一实现，依赖注入底层适配器
├── README.md      # 本设计文档
```

---

## 架构核心

### 1. 统一接口（IDataService）
- 所有数据服务实现均需遵循 `IDataService` 接口，保证业务层调用方式一致。
- 详见 `types/index.ts`。

### 2. 工厂模式
- 工厂根据环境变量或配置，动态选择合适的数据库适配器，并注入到 `DatabaseService`。
- 例如：开发环境用 IndexedDB，生产环境用 SQLite，测试环境用 Mock。

### 3. 注册表模式
- 所有数据服务实例统一注册到注册表，业务层通过注册表获取服务实例，实现解耦。

### 4. 适配器模式
- 每种数据库实现一个适配器，负责具体的数据操作逻辑。
- 适配器需实现统一接口，便于工厂和服务层调用。

---

## 环境配置与切换

- 支持通过环境变量（如 `NEXT_PUBLIC_DATABASE_ENV`）或配置对象，自动切换底层数据库实现。
- 配置项包括：同步开关、调试日志、后端类型、混合策略等，详见 `types/index.ts`。
- 工厂读取配置，自动选择并创建合适的服务实例。

---

## 业务层调用方式

业务层只依赖 `IDataService` 统一接口，无需关心底层数据库类型。

```typescript
import { createDataService } from './factory/data-service-factory';

const dataService = createDataService();
await dataService.initialize();
const user = await dataService.getUser('id123');
```

---

## 扩展与维护

- 新增数据库后端：只需实现适配器并在工厂注册。
- 新增配置项：在类型定义和工厂逻辑中补充即可。
- 业务层无需改动，保证高可维护性。

---

## 数据服务架构（Data Service Architecture）

本模块实现了统一的数据服务层，支持多种数据库后端（如 SQLite、IndexedDB），并通过工厂和注册表实现解耦与可扩展。

### 目录结构

- `types/`：统一接口与配置类型（IDataService, DataServiceConfig 等）
- `adapters/`：各类数据库适配器（如 SqliteDatabaseClient, IndexedDBDatabaseClient）
- `factory/`：工厂方法，动态创建数据服务实例
- `registry/`：服务注册表，支持多实例注册/获取

### 快速使用

#### 1. 配置与工厂

```typescript
import { DataServiceFactory } from './factory/data-service-factory';
import { DataServiceConfig } from './types';

const config: DataServiceConfig = {
  services: {
    data: {
      adapter: 'sqlite',
      options: {
        sqlite: { name: 'mydb.sqlite' }
      }
    }
  }
};

const dataService = DataServiceFactory.createService(config);
await dataService.initialize();
```

#### 2. 环境变量自动切换

无需传 config 时，工厂会根据 `NEXT_PUBLIC_DATABASE_ENV` 环境变量自动选择适配器：
- `sqlite`：使用 SqliteDatabaseClient
- `indexeddb`：使用 IndexedDBDatabaseClient
- `mock`：使用 MockDataService（预留）



#### 3. 注册表用法

```typescript
import { DataServiceRegistry } from '../registry/data-service-registry';

DataServiceRegistry.register('main', dataService);
const mainService = DataServiceRegistry.get('main');
```

#### 4. 业务层调用与事件示例

```typescript
// 基本 CRUD
const user = await dataService.findOne('users', 'id123');
await dataService.insert('users', { id: 'id124', name: '张三' });
await dataService.update('users', 'id124', { name: '李四' });
await dataService.delete('users', 'id124');

// 事件与缓存机制
mainService.on('insert', (entity) => {
  console.log('[event] 新数据插入：', entity);
});
mainService.on('update', (id, data) => {
  console.log('[event] 数据更新：', id, data);
});
mainService.on('delete', (id) => {
  console.log('[event] 数据删除：', id);
});

// 查询缓存演示
const cachedUser = await mainService.findOne('users', 'id124');
console.log('[cache] 查询缓存命中：', cachedUser);

// 资源销毁
await mainService.dispose();
```

### 扩展说明

- 新增适配器：实现 IDataService 并在工厂注册即可。
- 支持多实例：通过注册表可管理多个数据服务实例。
- 详细接口见 `types/index.ts`。
- 支持事件订阅（on/off/emit）、findOne/query 查询缓存与自动失效、懒加载与按需销毁。

### 单元测试建议

建议为工厂、注册表、各适配器补充单元测试，确保不同环境和配置下行为一致。

---

## 参考与约定

- 数据模型、仓储等与服务层解耦，单独维护于 `lib/db` 目录。
- 服务层仅负责数据访问的统一入口和底层实现切换。

---

如需进一步扩展或定制，请参考各目录下的 README 和类型定义。