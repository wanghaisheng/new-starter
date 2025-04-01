# IndexedDB 客户端

IndexedDBClient 是一个基于浏览器原生 IndexedDB API 的高性能数据库客户端实现，提供了完整的 CRUD 操作、事务支持、批量操作和丰富的查询功能。

## 主要特性

- **完整的 CRUD 操作**: 标准的创建、读取、更新和删除操作
- **高级查询**: 支持复杂的过滤条件、排序和分页
- **事务支持**: 完整的事务支持，确保数据操作的原子性
- **批量操作**: 支持批量添加、更新和删除操作
- **性能优化**: 内存缓存、查询缓存和其他性能优化
- **类型安全**: 完全支持 TypeScript 类型系统
- **错误处理**: 标准化的错误处理和日志记录
- **离线同步**: 支持离线数据存储和远程服务器同步

## 基本用法

```typescript
import { IndexedDBClient, IndexedDBConfig } from '@/core/lib/db/clients/indexeddb';

// 创建配置
const config: IndexedDBConfig = {
  name: 'my-app-db',
  version: 1,
  engine: 'indexeddb',
  
  // 可选配置
  cacheTimeout: 5 * 60 * 1000, // 缓存超时时间: 5分钟
  enableQueryCache: true,      // 启用查询缓存
  enableEntityCache: true      // 启用实体缓存
};

// 初始化客户端
const client = new IndexedDBClient(config);
await client.initialize();

// 基本 CRUD 操作
const user = await client.create('users', { name: '张三', email: 'zhangsan@example.com' });
const foundUser = await client.findById('users', user.id);
await client.update('users', user.id, { name: '张三更新' });
await client.delete('users', user.id);

// 查询
const result = await client.query('users', {
  where: {
    field: 'age',
    operator: '>',
    value: 18
  },
  orderBy: {
    field: 'createdAt',
    direction: 'desc'
  },
  limit: 10
});

// 事务
const result = await client.transaction(async (tx) => {
  const user = await tx.findById('users', 'user-id');
  await tx.update('users', 'user-id', { points: user.points + 10 });
  return user;
});

// 批处理
await client.batch('users', [
  { type: 'add', data: { name: '批量1', email: 'batch1@example.com' } },
  { type: 'put', data: { id: 'existing-id', name: '批量更新' } },
  { type: 'delete', data: { id: 'to-delete-id' } }
]);
```

## 错误处理

IndexedDBClient 会将 IndexedDB 原生错误转换为标准的 `DatabaseError` 对象，包含错误码、错误消息和额外的详细信息。

```typescript
try {
  await client.findById('users', 'non-existent-id');
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('用户不存在');
  } else {
    console.error('查询错误:', error.message, error.details);
  }
}
```

## 配置选项

```typescript
interface IndexedDBConfig extends DatabaseConfig {
  // 缓存超时时间（毫秒）
  // @default 300000 (5分钟)
  cacheTimeout?: number;

  // 是否启用查询缓存
  // @default true
  enableQueryCache?: boolean;

  // 是否启用实体缓存
  // @default true
  enableEntityCache?: boolean;
  
  // 同步配置
  // @default undefined
  syncConfig?: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    entityTypes: string[];
    deviceId?: string;
  };
}
```

## 离线同步支持

IndexedDBClient 集成了同步框架，可以在离线环境下工作，并在网络恢复时将数据同步到远程服务器。

### 配置离线同步

在 `.env.development` 文件中添加以下配置:

```
# 启用离线存储和同步
ENABLE_OFFLINE_STORAGE=true
SYNC_AUTO_ON_CONNECT=true
SYNC_INTERVAL=60000
SYNC_DEFAULT_PRIORITY=medium
SYNC_CONFLICT_RESOLUTION=server-wins

# IndexedDB 配置
INDEXEDDB_NAME=my-offline-app
INDEXEDDB_VERSION=1
```

### 初始化支持同步的 IndexedDB 客户端

```typescript
import { IndexedDBClient, IndexedDBConfig } from '@/core/lib/db/clients/indexeddb';
import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { createNetworkManager } from '@/core/lib/network/network-manager';

// 1. 创建网络管理器
const networkManager = createNetworkManager();

// 2. 创建 IndexedDB 客户端
const config: IndexedDBConfig = {
  name: 'my-offline-app',
  version: 1,
  engine: 'indexeddb',
  syncConfig: {
    enabled: true,
    autoSync: true,
    syncInterval: 60000,
    entityTypes: ['users', 'tasks', 'messages']
  }
};

const client = new IndexedDBClient(config);
await client.initialize();

// 3. 创建同步管理器
const syncManager = new SyncManager({
  client,
  networkManager,
  entityTypes: ['users', 'tasks', 'messages'],
  autoSyncOnConnect: true
});

// 4. 开始自动同步
syncManager.startAutoSync();

// 在应用程序使用客户端
const user = await client.create('users', { name: '张三', email: 'zhangsan@example.com' });
```

### 使用同步标志

您可以使用 `SyncManager` 手动标记实体的同步状态：

```typescript
import { SyncState, SyncPriority } from '@/core/lib/db/types/sync-flags';

// 获取用户
const user = await client.findById('users', '123');

// 标记为已修改并需要同步
const syncableUser = syncManager.markForSync(user, SyncState.MODIFIED, SyncPriority.HIGH);

// 更新用户
await client.update('users', '123', syncableUser);

// 手动触发同步
await syncManager.sync();
```

### 查询同步状态

索引支持同步状态查询：

```typescript
// 查找所有待同步的用户
const pendingUsers = await client.query('users', {
  where: {
    field: '_sync.syncState',
    operator: 'in',
    value: [SyncState.NEW, SyncState.MODIFIED, SyncState.DELETED]
  }
});

console.log('待同步的用户数:', pendingUsers.data.length);

// 查找同步失败的任务
const failedTasks = await client.query('tasks', {
  where: {
    field: '_sync.syncState',
    operator: '==',
    value: SyncState.FAILED
  }
});

console.log('同步失败的任务:', failedTasks.data);
```

### 离线优先开发

当使用 IndexedDBClient 进行离线优先开发时，推荐以下最佳实践：

1. **优先设计离线功能**：首先确保应用能在完全离线的环境下工作
2. **分层数据访问**：使用仓储模式封装数据访问逻辑，隐藏同步细节
3. **同步指示器**：在UI中提供同步状态指示器，让用户了解数据同步情况
4. **冲突解决策略**：为可能发生冲突的实体定义明确的冲突解决策略
5. **批量同步**：对大量数据使用批量同步，避免一次性同步过多数据

## 与 fake-indexeddb 集成

fake-indexeddb 可以与同步框架结合使用，为测试环境提供完整的离线同步支持。

```typescript
import { 
  setupFakeIndexedDB, 
  resetFakeIndexedDB,
  IndexedDBClient
} from '@/core/lib/db/clients/indexeddb';
import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { MockNetworkManager } from '@/core/lib/network/mock-network-manager';

// 设置测试环境
setupFakeIndexedDB();

// 创建模拟网络管理器
const networkManager = new MockNetworkManager();

// 创建 IndexedDBClient
const client = new IndexedDBClient({
  name: 'test-db',
  version: 1,
  engine: 'indexeddb',
  syncConfig: {
    enabled: true,
    autoSync: false, // 禁用自动同步以便于测试
    entityTypes: ['users']
  }
});

await client.initialize();

// 创建同步管理器
const syncManager = new SyncManager({
  client,
  networkManager,
  entityTypes: ['users'],
  autoSyncOnConnect: false // 禁用自动同步以便于测试
});

// 测试离线场景
networkManager.simulateOffline(true);

// 创建用户（将在本地存储，标记为未同步）
const user = await client.create('users', { name: '离线用户' });
console.log('用户同步状态:', user._sync?.syncState); // NEW

// 恢复网络连接并触发同步
networkManager.simulateOffline(false);
await syncManager.sync();

// 查询已同步的用户
const syncedUser = await client.findById('users', user.id);
console.log('同步后状态:', syncedUser._sync?.syncState); // SYNCED

// 清理环境
resetFakeIndexedDB();
```

---

# Fake IndexedDB 测试工具

为了便于在 Node.js 环境下进行单元测试，我们提供了 `fake-indexeddb` 集成，这是一个纯 JavaScript 实现的内存中 IndexedDB API。

## 主要特性

- **纯 JavaScript 实现**: 不依赖浏览器环境，可在 Node.js 中使用
- **完整的 API 兼容**: 与浏览器的 IndexedDB API 保持一致
- **内存存储**: 数据仅存储在内存中，不会持久化到磁盘
- **测试辅助工具**: 提供了便捷的测试帮助类和工具函数
- **全局环境设置**: 可快速设置和重置全局 IndexedDB 对象

## 安装

需要确保项目中安装了 `fake-indexeddb` 包：

```bash
npm install --save-dev fake-indexeddb
```

## 基本用法

### 1. 直接使用 fake-indexeddb

```typescript
import { 
  fakeIndexedDB, 
  setupFakeIndexedDB, 
  resetFakeIndexedDB 
} from '@/core/lib/db/clients/indexeddb';

// 设置全局环境
setupFakeIndexedDB();

// 使用 IndexedDB API
const request = fakeIndexedDB.open('TestDB', 1);
request.onupgradeneeded = () => {
  const db = request.result;
  const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
  store.createIndex('by_email', 'email', { unique: true });
};

// ... 执行其他操作 ...

// 重置环境
resetFakeIndexedDB();
```

### 2. 使用测试帮助类

```typescript
import { 
  setupFakeIndexedDB, 
  IndexedDBTestHelper 
} from '@/core/lib/db/clients/indexeddb';

// 设置全局环境
setupFakeIndexedDB();

// 创建帮助类实例
const helper = new IndexedDBTestHelper('TestDB');

// 打开数据库
await helper.openDatabase(1, (db) => {
  const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
  store.createIndex('by_email', 'email', { unique: true });
});

// 添加测试数据
await helper.addTestData('users', [
  { name: '张三', email: 'zhangsan@example.com', age: 30 },
  { name: '李四', email: 'lisi@example.com', age: 25 }
]);

// 获取所有数据
const users = await helper.getAllData('users');
console.log(users);

// 清空存储
await helper.clearStore('users');

// 删除数据库
await helper.deleteDatabase();
```

### 3. 在测试框架中使用（如 Jest）

```typescript
import { 
  setupFakeIndexedDB, 
  resetFakeIndexedDB, 
  IndexedDBTestHelper 
} from '@/core/lib/db/clients/indexeddb';

// 在所有测试之前设置
beforeAll(() => {
  setupFakeIndexedDB();
});

// 在所有测试之后清理
afterAll(() => {
  // 可选，根据需要决定是否重置
});

// 在每个测试之前重置状态
beforeEach(() => {
  resetFakeIndexedDB();
});

// 测试用例
test('should store and retrieve user data', async () => {
  const helper = new IndexedDBTestHelper('TestDB');
  
  await helper.openDatabase(1, (db) => {
    db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
  });
  
  const testUser = { name: '测试用户', email: 'test@example.com', age: 30 };
  await helper.addTestData('users', [testUser]);
  
  const users = await helper.getAllData('users');
  
  expect(users.length).toBe(1);
  expect(users[0].name).toBe('测试用户');
  
  await helper.deleteDatabase();
});
```

## 测试帮助类 API

`IndexedDBTestHelper` 提供以下方法：

- `openDatabase(version?, setupCallback?)`: 打开测试数据库
- `closeDatabase()`: 关闭数据库连接
- `deleteDatabase()`: 删除测试数据库
- `addTestData(storeName, data)`: 添加测试数据
- `getAllData(storeName)`: 获取所有数据
- `clearStore(storeName)`: 清空存储

## 工具函数

- `setupFakeIndexedDB()`: 设置全局 IndexedDB 环境
- `resetFakeIndexedDB()`: 重置 IndexedDB 状态
- `createTestDatabase(dbName, version?, setupCallback?)`: 创建测试数据库
- `deleteTestDatabase(dbName)`: 删除测试数据库

## 使用范例

完整使用示例可参考 `fake-indexeddb-example.ts` 文件，其中包含了基本用法、帮助类用法和测试框架集成示例。

## 注意事项

1. fake-indexeddb 主要用于测试目的，不建议在生产环境中使用
2. 某些复杂的 IndexedDB 功能在 fake-indexeddb 中可能实现不完整
3. 数据仅存储在内存中，不会持久化到磁盘
4. 在浏览器环境中，仍建议使用原生 IndexedDB API

## 参考资料

- [fake-indexeddb GitHub 仓库](https://github.com/dumbmatter/fakeIndexedDB)
- [MDN IndexedDB API 文档](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 