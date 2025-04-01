# Mock数据库客户端

`MockDatabaseClient` 是一个用于测试和开发环境的模拟数据库客户端实现。它提供了与真实数据库相同的接口，但使用内存或JSON文件作为数据存储。这使得开发者可以在不依赖真实数据库的情况下进行开发和测试。

## 相关实现

除了 `MockDatabaseClient` 外，系统还提供了 `MockIndexedDBClient`，一个专门用于测试和开发环境的基于 fake-indexedDB 的模拟实现，它具有以下特点：

- 继承自 `IndexedDBClient`，提供与真实 IndexedDB 相同的 API
- 使用 fake-indexedDB 模拟浏览器的 IndexedDB API
- 自动设置测试环境，无需额外配置
- 提供重置和清空测试数据的便捷方法
- 适用于单元测试和集成测试环境

## 架构设计说明

在本系统中，我们采用了双重存储模拟策略：

- **MockDatabaseClient（内存/JSON模式）**：用于模拟远程数据存储（如服务器端数据库、云数据库）
- **MockIndexedDBClient（fake-indexeddb）**：用于模拟客户端的离线存储（如浏览器的 IndexedDB）

这种设计与真实应用架构一致，其中远程服务器存储主数据，而客户端维护本地离线缓存。

## 特点

- 实现了 `IDatabaseClient` 接口的所有方法
- 支持内存模式和JSON文件模式
- 提供内置的测试数据
- 支持完整的CRUD操作
- 支持事务和批处理
- 支持查询和过滤
- 轻量级实现，无需外部依赖
- **无缝过渡**: 可以在开发阶段使用，然后无代码更改地切换到生产环境中的真实数据库
- **离线同步支持**: 与同步框架集成，支持离线数据与远程服务器同步

## 工作模式

`MockDatabaseClient` 支持两种工作模式：

### 1. 内存模式（Memory Mode）

在内存模式下，所有数据都存储在内存中，应用程序重启后数据会丢失。这种模式适用于单元测试和临时开发环境。

### 2. JSON文件模式（JSON Mode）

在JSON文件模式下，数据存储在JSON文件中，应用程序重启后数据仍然保留。这种模式适用于需要持久化数据的开发和测试环境。

## 配置选项

创建 `MockDatabaseClient` 实例时，可以指定以下配置选项：

```typescript
interface MockDatabaseConfig extends DatabaseConfig {
  // 数据源模式: 'memory' | 'json'
  mockMode?: 'memory' | 'json';

  // JSON文件路径（当mockMode为'json'时使用）
  jsonFilePath?: string;

  // 是否自动保存对JSON文件的更改
  autoSave?: boolean;
  
  // 同步配置
  syncConfig?: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
    entityTypes: string[];
  };
}
```

- `mockMode`: 指定数据存储模式，默认为 `'memory'`
- `jsonFilePath`: 当使用JSON文件模式时，指定JSON文件的路径，默认为 `'./mock-data.json'`
- `autoSave`: 是否在数据变更后自动保存到JSON文件，默认为 `false`
- `syncConfig`: 同步配置，控制数据同步行为

## 使用示例

### 内存模式

```typescript
import { MockDatabaseClient } from './mock/mock-client';

// 创建内存模式的客户端
const db = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'memory' // 可选，默认就是内存模式
});

// 初始化数据库
await db.initialize();

// 使用数据库
const users = await db.findUsers();
console.log('内存中的用户:', users);

// 关闭连接
await db.close();
```

### JSON文件模式

```typescript
import { MockDatabaseClient } from './mock/mock-client';

// 创建JSON文件模式的客户端
const db = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'json',
  jsonFilePath: './data/test-db.json',
  autoSave: true // 启用自动保存
});

// 初始化数据库
await db.initialize();

// 使用数据库
const user = await db.createUser({
  name: 'John Doe',
  bio: 'Test user',
  birthDate: new Date(1990, 0, 1),
  gender: 'male',
  interests: ['music', 'sports'],
  photos: [],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  },
  preferences: {
    ageRange: { min: 18, max: 40 },
    distance: 50,
    gender: ['female'],
    interests: ['music', 'art']
  },
  isVerified: true,
  lastActive: new Date(),
  status: 'active'
});

console.log('创建的用户:', user);
// 数据已自动保存到JSON文件

// 关闭连接
await db.close();
```

### 手动保存和加载JSON数据

如果没有启用自动保存，可以手动调用方法保存和加载数据：

```typescript
// 创建不自动保存的JSON模式客户端
const db = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'json',
  jsonFilePath: './data/test-db.json',
  autoSave: false
});

await db.initialize();

// 执行一些操作...
await db.createUser({ /* 用户数据 */ });
await db.updateUser('user-1', { /* 更新数据 */ });

// 手动保存数据
await db.saveToJson();

// 手动重新加载数据
await db.reloadFromJson();
```

## 离线同步支持

`MockDatabaseClient` 现在与同步框架完全集成，支持数据同步标志和离线/在线同步功能。

### 启用同步功能

在 `.env.development` 文件中添加以下配置:

```
# 启用离线存储和同步
ENABLE_OFFLINE_STORAGE=true
SYNC_AUTO_ON_CONNECT=true
SYNC_INTERVAL=60000
SYNC_DEFAULT_PRIORITY=medium
SYNC_CONFLICT_RESOLUTION=server-wins

# Mock数据库特定配置
MOCK_DB_MODE=json
MOCK_DB_FILE_PATH=./data/dev-database.json
MOCK_DB_AUTO_SAVE=true
```

### 使用同步标志

使用 `MockDatabaseClient` 时，你可以标记实体的同步状态：

```typescript
import { MockDatabaseClient } from './clients/mock/mock-client';
import { SyncManager } from '../sync/sync-manager';
import { SyncState, SyncPriority } from '../types/sync-flags';

// 创建数据库客户端
const db = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'json',
  jsonFilePath: './data/test-db.json',
  autoSave: true,
  syncConfig: {
    enabled: true,
    autoSync: true,
    syncInterval: 60000,
    entityTypes: ['users', 'tasks', 'messages']
  }
});

// 初始化数据库
await db.initialize();

// 创建同步管理器
const syncManager = new SyncManager({
  client: db,
  entityTypes: ['users', 'tasks', 'messages'],
  autoSyncOnConnect: true
});

// 获取用户
const user = await db.findById('users', '123');

// 标记为已修改并需要同步
const syncableUser = syncManager.markForSync(user, SyncState.MODIFIED, SyncPriority.HIGH);

// 更新用户
await db.update('users', '123', syncableUser);

// 手动触发同步
await syncManager.sync();
```

### 自动同步配置

如果在配置中启用了自动同步，`MockDatabaseClient` 会在数据变更时自动标记实体为需要同步，
并根据配置的间隔时间定期同步数据。

```typescript
const db = new MockDatabaseClient({
  // ... 其他配置 ...
  syncConfig: {
    enabled: true,      // 启用同步
    autoSync: true,     // 启用自动同步
    syncInterval: 60000, // 同步间隔为60秒
    entityTypes: ['users', 'tasks', 'messages'] // 需要同步的实体类型
  }
});
```

### 同步状态查询

可以查询实体的同步状态：

```typescript
// 查找所有待同步的用户
const pendingUsers = await db.query('users', {
  where: {
    field: '_sync.syncState',
    operator: 'in',
    value: [SyncState.NEW, SyncState.MODIFIED, SyncState.DELETED]
  }
});

console.log('待同步的用户数:', pendingUsers.data.length);

// 查找同步失败的任务
const failedTasks = await db.query('tasks', {
  where: {
    field: '_sync.syncState',
    operator: '==',
    value: SyncState.FAILED
  }
});

console.log('同步失败的任务:', failedTasks.data);
```

## 离线存储方案选择指南

本项目提供了两种不同的离线存储模拟方案，对应真实应用中的不同存储层：

### 1. MockDatabaseClient (内存/JSON模式)

**适用场景**:
- 模拟远程服务器/云数据库
- 需要在开发环境模拟服务器API响应
- 需要轻松查看和编辑模拟的服务器数据
- 测试数据同步机制

**优势**:
- 简单易用，无需真实服务器环境
- JSON文件可直接编辑，便于调试服务器数据
- 可配置响应延迟来模拟网络延迟
- 可模拟服务器错误和各种响应场景

### 2. fake-indexeddb 模拟方案

**适用场景**:
- 模拟客户端的本地离线存储
- 测试应用程序在离线模式下的行为
- 测试IndexedDB特有功能（如索引、游标等）
- 测试客户端离线缓存逻辑

**优势**:
- 完全实现 IndexedDB API
- 精确模拟客户端离线存储行为
- 适合测试应用的离线功能
- 不依赖真实浏览器环境

## 混合离线存储策略

典型应用场景是同时使用两种存储方案，创建完整的在线/离线工作流：

1. 使用 **MockDatabaseClient (JSON模式)** 作为远程服务器的模拟
2. 使用 **MockIndexedDBClient (fake-indexeddb)** 作为客户端离线存储的模拟

这种混合策略适用于开发具有离线功能的应用程序，能够测试：
- 客户端从服务器初始数据加载
- 客户端离线操作和数据存储
- 客户端重新连接时的数据同步
- 同步冲突解决

### 混合策略配置示例

在 `.env.development` 中:

```
# 启用混合模式
USE_HYBRID_STORAGE=true

# 远程数据库模拟 (Mock)
REMOTE_DB_TYPE=mock
MOCK_DB_MODE=json
MOCK_DB_FILE_PATH=./data/remote-db.json
MOCK_DB_AUTO_SAVE=true

# 本地离线存储 (fake-indexeddb)
LOCAL_STORAGE_TYPE=indexeddb
USE_FAKE_INDEXEDDB=true
INDEXEDDB_NAME=local-offline-storage
INDEXEDDB_VERSION=1

# 同步配置
SYNC_ON_CONNECT=true
SYNC_INTERVAL=60000
SYNC_AUTO_RESOLVE_CONFLICTS=true
```

## .env 配置示例

### MockDatabaseClient 配置

在 `.env.development` 文件中添加以下配置:

```
# Database type configuration
DB_TYPE=mock

# MockDatabaseClient configuration
MOCK_DB_MODE=json
MOCK_DB_FILE_PATH=./data/dev-database.json
MOCK_DB_AUTO_SAVE=true
MOCK_DB_SIMULATE_DELAY=200

# Remote database simulation
SIMULATE_REMOTE=false
REMOTE_DB_URL=
SYNC_INTERVAL=300000
```

### fake-indexeddb 配置

在 `.env.development` 文件中添加以下配置:

```
# Database type configuration
DB_TYPE=indexeddb

# Enable fake-indexeddb
USE_FAKE_INDEXEDDB=true

# IndexedDB configuration
INDEXEDDB_NAME=my-offline-app
INDEXEDDB_VERSION=1

# Offline behavior simulation
SIMULATE_OFFLINE=false
SIMULATE_NETWORK_LATENCY=200
```

## 作为离线存储方案与生产环境集成

### 无缝过渡到生产数据库

`MockDatabaseClient` 完全实现了 `IDatabaseClient` 接口，使其能够作为生产数据库（如 IndexedDB）的替代品，用于开发和测试环境。通过使用统一的抽象层，您可以在不修改应用程序代码的情况下，轻松切换后端数据存储。

#### 实现方式：数据库工厂

```typescript
// src/core/lib/db/client-factory.ts
import { IDatabaseClient, DatabaseConfig } from './interfaces';
import { MockDatabaseClient } from './clients/mock/mock-client';
import { IndexedDBClient } from './clients/indexeddb/indexeddb-client';
import { setupFakeIndexedDB } from './clients/indexeddb/fake-indexeddb';

export class DatabaseClientFactory {
  static createClient(config: DatabaseConfig): IDatabaseClient {
    const env = process.env.NODE_ENV || 'development';
    const dbType = process.env.DB_TYPE || (env === 'production' ? 'indexeddb' : 'mock');
    
    switch (dbType) {
      case 'indexeddb':
        // 如果启用了fake-indexeddb，先设置它
        if (process.env.USE_FAKE_INDEXEDDB === 'true') {
          console.log('使用 fake-indexeddb 模拟 IndexedDB');
          setupFakeIndexedDB();
        }
        return new IndexedDBClient(config);
        
      case 'mock':
      default:
        // 扩展配置，添加mock特定选项
        const mockConfig = {
          ...config,
          mockMode: (process.env.MOCK_DB_MODE as 'memory' | 'json') || 'memory',
          jsonFilePath: process.env.MOCK_DB_FILE_PATH || './mock-data.json',
          autoSave: process.env.MOCK_DB_AUTO_SAVE === 'true'
        };
        
        // 创建mock客户端
        const client = new MockDatabaseClient(mockConfig);
        
        // 如果指定了延迟，添加模拟延迟
        if (process.env.MOCK_DB_SIMULATE_DELAY) {
          const delay = parseInt(process.env.MOCK_DB_SIMULATE_DELAY);
          return this.wrapWithDelay(client, delay);
        }
        
        return client;
    }
  }
  
  // 添加延迟的辅助方法
  private static wrapWithDelay(client: IDatabaseClient, delayMs: number): IDatabaseClient {
    // 创建一个代理，给异步方法添加延迟
    return new Proxy(client, {
      get(target, prop) {
        const property = target[prop as keyof IDatabaseClient];
        
        // 只给异步方法添加延迟
        if (typeof property === 'function' && 
            prop !== 'constructor' && 
            prop !== 'on' && 
            prop !== 'emit') {
          
          return async (...args: any[]) => {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return (property as Function).apply(target, args);
          };
        }
        
        return property;
      }
    });
  }
}
```

#### 在应用程序中使用

```typescript
import { DatabaseClientFactory } from '@/core/lib/db/client-factory';

// 统一配置
const dbConfig = {
  name: 'my-app-db',
  version: 1,
  // 其他通用配置
};

// 创建适合当前环境的数据库客户端
const dbClient = DatabaseClientFactory.createClient(dbConfig);
await dbClient.initialize();

// 正常使用客户端，无需关心具体实现
const users = await dbClient.findUsers();
```

### 使用 JSON 模式作为离线存储

JSON 文件模式可以作为优秀的离线数据存储解决方案，特别适用于离线优先的 Web 应用和桌面应用：

1. **离线开发环境**：开发人员可以在没有网络连接的情况下进行开发和测试
2. **数据持久化**：数据保存在本地 JSON 文件中，应用程序重启后数据不会丢失
3. **数据迁移测试**：可以测试真实数据迁移场景，而无需连接到实际数据库

#### 离线优先策略示例

```typescript
// src/core/lib/db/offline-manager.ts
import { MockDatabaseClient } from './clients/mock/mock-client';
import { IndexedDBClient } from './clients/indexeddb/indexeddb-client';

export class OfflineManager {
  private mockClient: MockDatabaseClient;
  private realClient: IndexedDBClient;
  private isOnline: boolean = navigator.onLine;
  
  constructor(config) {
    this.mockClient = new MockDatabaseClient({
      ...config,
      mockMode: 'json',
      autoSave: true
    });
    
    this.realClient = new IndexedDBClient(config);
    
    // 监听在线状态变化
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }
  
  // 获取适当的客户端
  getClient() {
    return this.isOnline ? this.realClient : this.mockClient;
  }
  
  // 在恢复在线连接时同步数据
  private handleOnline = async () => {
    this.isOnline = true;
    // 将离线数据同步到在线数据库
    await this.syncOfflineChanges();
  }
  
  private handleOffline = () => {
    this.isOnline = false;
    // 切换到离线模式
  }
  
  // 同步离线更改到在线数据库
  private async syncOfflineChanges() {
    // 实现离线数据同步逻辑
  }
}
```

## 用于原型开发和分阶段部署

使用 `MockDatabaseClient` 进行原型开发和分阶段部署的优势：

1. **快速原型设计**：在没有后端的情况下快速构建和测试前端应用
2. **前后端并行开发**：前端团队可以使用Mock客户端进行开发，而后端团队同时开发实际的API
3. **分阶段部署**：在部署真实数据库之前，可以先使用Mock客户端进行部署和测试

### 阶段性演进策略

1. **开发阶段**：使用 `MockDatabaseClient` 的内存模式进行快速开发和单元测试
2. **集成测试阶段**：使用 `MockDatabaseClient` 的JSON模式进行集成测试和更复杂的场景测试
3. **内部发布阶段**：继续使用 `MockDatabaseClient` 的JSON模式，但增加更真实的数据集
4. **生产准备阶段**：切换到 `IndexedDBClient` 进行最终测试
5. **生产阶段**：完全使用 `IndexedDBClient`，无需更改应用程序代码

## 事务处理

JSON模式下的事务处理通过在事务失败时重新加载JSON文件来实现回滚：

```typescript
try {
  await db.transaction(async (tx) => {
    // 在事务中执行操作
    await tx.create('users', { /* 用户数据 */ });
    await tx.create('messages', { /* 消息数据 */ });
    
    // 如果抛出异常，事务将回滚
    if (somethingWrong) {
      throw new Error('回滚事务');
    }
  });
} catch (error) {
  console.error('事务失败:', error);
}
```

## 模拟网络延迟

在开发环境中，可能需要模拟网络延迟来测试应用程序的加载状态和性能。你可以通过以下方式实现：

```typescript
// 创建一个包装函数来模拟延迟
async function withDelay<T>(promise: Promise<T>, delayMs: number = 500): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return promise;
}

// 使用封装的客户端
const db = new MockDatabaseClient({ /* 配置 */ });
await db.initialize();

// 使用时添加延迟
const users = await withDelay(db.findUsers());
```

## 存储方案对比

| 功能/特性 | MockDatabaseClient (内存) | MockDatabaseClient (JSON) | fake-indexeddb | 真实 IndexedDB |
|----------|------------------------|------------------------|---------------|--------------|
| 数据持久化 | ❌ 应用关闭后丢失 | ✅ 文件存储 | ✅ 应用运行期间保持 | ✅ 浏览器存储 |
| 兼容性 | ✅ 任何环境 | ✅ 任何有文件系统的环境 | ✅ Node.js & 浏览器 | ❌ 仅浏览器 |
| 数据可读性 | ⚠️ 仅调试中可见 | ✅ 可直接编辑JSON | ❌ 内部格式 | ❌ 内部格式 |
| 事务支持 | ⚠️ 模拟实现 | ⚠️ 模拟实现 | ✅ 完全支持 | ✅ 完全支持 |
| 索引支持 | ⚠️ 模拟实现 | ⚠️ 模拟实现 | ✅ 完全支持 | ✅ 完全支持 |
| 性能(小数据集) | ✅ 高 | ⚠️ 中等 | ✅ 高 | ✅ 高 |
| 性能(大数据集) | ⚠️ 中等 | ❌ 低 | ⚠️ 中等 | ✅ 高 |
| IndexedDB API | ❌ 使用通用接口 | ❌ 使用通用接口 | ✅ 完全兼容 | ✅ 原生 |
| 调试简易度 | ✅ 高 | ✅ 高 | ⚠️ 中等 | ❌ 低 |
| 实现复杂度 | ✅ 低 | ✅ 低 | ⚠️ 中等 | ⚠️ 中等 |
| 离线同步支持 | ✅ 内置支持 | ✅ 内置支持 | ✅ 支持但需额外代码 | ✅ 支持但需额外代码 |
| 同步指标监控 | ✅ 内置支持 | ✅ 内置支持 | ❌ 需自行实现 | ❌ 需自行实现 |
| 跨环境同步 | ✅ 高 | ✅ 高 | ⚠️ 中等 | ⚠️ 中等 |

## 最佳实践

1. **在单元测试中使用内存模式**：单元测试应该是独立的，内存模式确保每次测试运行都从干净的状态开始。

2. **在集成测试中使用JSON文件模式**：集成测试可能需要更持久的数据，JSON文件模式允许在多次运行之间保持数据状态。

3. **使用特定的JSON文件**：对不同的测试场景使用不同的JSON文件，以避免不同测试之间的干扰。

4. **处理日期字段**：在使用JSON模式时，请注意日期字段会被序列化为字符串，但客户端会自动将其转换回Date对象。

5. **手动控制保存**：对于性能敏感的场景，建议禁用autoSave并在适当的时候手动调用saveToJson()。

6. **共享数据模型**：确保Mock客户端和真实客户端使用相同的数据模型和架构定义。

7. **环境变量切换**：使用环境变量控制使用哪种数据库客户端，便于在不同环境之间切换。

8. **逐步过渡**：从开发到生产环境，建议逐步过渡而不是一次性切换所有组件。

9. **特定测试选择正确工具**：对于测试 IndexedDB 特定功能时使用 fake-indexeddb，对于通用数据操作测试使用 MockDatabaseClient。

10. **混合策略灵活运用**：在复杂应用中，考虑结合使用多种存储策略，如远程数据使用 MockDatabaseClient，本地缓存使用 fake-indexeddb。

11. **利用同步标志**: 为需要在线/离线同步的实体使用同步标志，确保数据能在不同环境间正确同步。

12. **合理设置同步优先级**: 对业务关键数据使用较高的同步优先级，以确保它们优先同步。

13. **监控同步状态**: 在开发和测试过程中，定期检查同步状态，及早发现同步问题。

14. **测试网络中断场景**: 使用网络管理器模拟网络中断，测试应用在离线状态下的表现和恢复在线后的同步行为。

## 注意事项

- JSON模式下，事务隔离级别是有限的，它主要通过重新加载文件来回滚操作。
- 在处理大量数据时，注意内存使用情况。
- 该客户端仅用于测试和开发环境，不建议在生产环境中使用。
- JSON文件模式在并发访问时没有锁机制，可能导致数据不一致。
- 当过渡到真实数据库时，需要注意数据迁移策略。
- 虽然接口一致，但某些高级功能在Mock客户端中可能只是部分实现或模拟实现。
- fake-indexeddb 在某些边缘情况下可能与真实 IndexedDB 行为有细微差异。
- 在使用 fake-indexeddb 时，需要确保项目中已安装该依赖 (`npm install fake-indexeddb --save-dev`)。 