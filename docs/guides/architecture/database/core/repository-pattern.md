# 数据库仓储模式实现指南

本文档详细介绍了项目中数据库仓储模式的实现方式、使用方法以及最近的优化和修复。

## 概述

仓储模式 (Repository Pattern) 是将数据访问逻辑与业务逻辑分离的设计模式。在我们的项目中，它充当了数据库客户端和应用程序业务逻辑之间的中间层。

## 架构设计

我们的数据库仓储实现遵循以下层次结构：

```
业务逻辑层 (Services)
       ↓
   仓储层 (Repositories)
       ↓ 
数据库客户端层 (DatabaseClients)
       ↓
  存储引擎层 (Storage Engines)
```

### 核心组件

1. **BaseRepository**: 所有具体仓储的抽象基类，提供通用的 CRUD 操作
2. **具体仓储类**: 如 `UserRepository`, `MatchRepository` 等，提供特定实体的数据访问方法
3. **数据库客户端**: 提供对特定数据库技术的封装，如 `IndexedDBClient`, `SQLiteClient` 等
4. **数据库工厂**: 根据环境创建适当的数据库客户端实例

## 仓储设计原则

1. **统一接口**: 所有仓储都实现相同的基本接口，使其可互换
2. **类型安全**: 充分利用 TypeScript 的类型系统，确保类型安全
3. **离线优先**: 支持离线操作和同步功能
4. **单一职责**: 每个仓储类只负责一种实体类型的数据访问
5. **查询封装**: 复杂查询逻辑封装在仓储内部，不暴露给调用者

## 最近的优化与修复

### 1. QueryResult 处理统一化

**问题描述**:
BaseRepository 的 `query` 方法返回 `QueryResult<T>` 对象，而具体仓储类的自定义查询方法需要返回 `T[]`，这导致了不一致性。

**解决方案**:
- 统一所有仓储方法返回类型，确保自定义查询方法正确地从 `QueryResult<T>` 中提取 `data` 属性
- 修改 `BaseRepository.findAll` 方法，使其从 `QueryResult` 中提取数据并返回 `T[]`

```typescript
// 修复前
async findAll(filter?: Record<string, any>): Promise<T[]> {
  return this.client.findAll(this.tableName, filter) as Promise<T[]>;
}

// 修复后
async findAll(filter?: Record<string, any>): Promise<T[]> {
  const result = await this.client.findAll(this.tableName, filter);
  // 处理结果可能是 QueryResult 或直接是实体数组的情况
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data as T[];
  }
  return result as T[];
}
```

### 2. 平台检测功能增强

**问题描述**:
在处理不同平台（Web、Android、iOS）时缺乏可靠的平台检测机制。

**解决方案**:
创建了健壮的平台检测工具 (`platform.ts`)，支持:
- 检测当前运行平台 (Web/Android/iOS)
- 检测当前环境 (开发/测试/生产)
- 安全处理 Capacitor 的可用性检测

```typescript
export function getAppPlatform(): AppPlatform {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  // 首先尝试使用 Capacitor API
  if (isCapacitorAvailable()) {
    try {
      const platform = (window as any).Capacitor.getPlatform();
      if (platform === 'android') return 'android';
      if (platform === 'ios') return 'ios';
    } catch (e) {
      // 降级到 User-Agent 检测
      // ...
    }
  }
  
  // 默认为 Web 平台
  return 'web';
}
```

### 3. SQLite 配置优化

**问题描述**:
SQLite 数据库配置分散且不一致，缺乏标准化的配置接口和示例。

**解决方案**:
- 创建了专用的 SQLite 配置文件，定义标准配置接口
- 添加了适合不同环境的默认配置
- 提供了详细的配置选项和注释

```typescript
export interface SQLiteConfig {
  database: {
    name: string;
    version: number;
  };
  encryption?: {
    enabled: boolean;
    key?: string;
  };
  // 其他配置选项...
}

export const DEFAULT_SQLITE_CONFIG: SQLiteConfig = {
  database: {
    name: 'heytcm_db',
    version: 1
  },
  // 其他默认配置...
};
```

### 4. 数据库工厂改进

**问题描述**:
数据库工厂类在创建客户端实例时存在配置不完整的问题，导致类型错误。

**解决方案**:
- 提供更完整的默认配置，确保包含所有必需属性
- 改进错误处理和回退机制
- 简化客户端创建逻辑

```typescript
static createClient(type: string, config: Partial<DatabaseConfig> = {}): IDatabaseClient {
  // 提供完整的默认配置
  const defaultConfig: DatabaseConfig = {
    name: 'default',
    version: 1,
    engine: 'mock',
    tables: {}
  };
  
  // 合并用户提供的配置
  const mergedConfig = { ...defaultConfig, ...config };
  
  // 创建客户端...
}
```

### 5. 类型定义扩展

**问题描述**:
`DatabaseEngine` 类型定义不包含所有支持的引擎类型，如 `capacitor-sqlite`。

**解决方案**:
扩展 `DatabaseEngine` 类型定义，确保包含所有支持的引擎类型：

```typescript
export type DatabaseEngine = 'mock' | 'mock-indexeddb' | 'indexeddb' | 'sqlite' | 
  'capacitor-sqlite' | 'cloudflare-d1' | 'firebase' | 'supabase' | 'turso' | 
  'tidb' | 'postgres';
```

## 使用指南

### 基本用法

1. **创建仓储实例**

```typescript
// 获取数据库服务实例
const dbService = DatabaseService.getInstance();
await dbService.initialize();

// 获取用户仓储
const userRepository = dbService.getUserRepository();
```

2. **基本 CRUD 操作**

```typescript
// 创建用户
const user = await userRepository.create({
  name: '张三',
  email: 'zhangsan@example.com',
  // 其他用户属性...
});

// 查询用户
const users = await userRepository.findAll();
const user = await userRepository.findById('user-123');

// 更新用户
await userRepository.update('user-123', { name: '张三 (已修改)' });

// 删除用户
await userRepository.delete('user-123');
```

3. **高级查询**

```typescript
// 使用查询选项
const results = await userRepository.query({
  where: { 
    field: 'age', 
    operator: '>=', 
    value: 18 
  },
  orderBy: { 
    field: 'name', 
    direction: 'asc' 
  },
  limit: 10
});

// 自定义查询方法
const activeUsers = await userRepository.findRecentlyActive(5);
```

### 离线支持

我们的仓储实现支持离线优先策略：

```typescript
// 检查表是否配置为仅离线存储
protected isOfflineOnly(): boolean {
  const schema = this.schemaRegistry.getSchema(this.tableName);
  return !!schema?.syncConfig?.offlineOnly;
}

// 创建实体时添加同步标记
async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
  // 创建基础实体
  const entity = await this.client.create(this.tableName, data as T);
  
  // 如果是离线专用表，则标记为已同步状态
  if (this.isOfflineOnly()) {
    return {
      ...entity,
      _sync: {
        syncState: SyncState.SYNCED,
        localModifiedAt: new Date(),
        syncPriority: SyncPriority.LOW,
      }
    } as unknown as T;
  }
  
  return entity as T;
}
```

## 最佳实践

1. **使用具体仓储方法而非通用方法**
   - 优先使用 `userRepository.findByName(name)` 而非 `userRepository.query({ where: { name } })`

2. **正确处理 QueryResult**
   - 当使用 `query` 方法时，总是访问 `.data` 属性获取实际结果
   - 例如: `const users = (await userRepository.query(options)).data`

3. **避免直接访问数据库客户端**
   - 总是通过仓储访问数据，确保一致的数据处理逻辑
   - 不要使用 `userRepository.client.findAll()`

4. **添加新的仓储类时遵循模式**
   - 继承 `BaseRepository<T>`
   - 实现特定实体的自定义查询方法
   - 确保从查询结果中正确提取数据

## 测试策略

1. **单元测试**
   - 使用模拟数据库客户端测试仓储逻辑
   - 确保测试覆盖所有公共方法

2. **集成测试**
   - 使用 `MockDatabaseClient` 或 `MockIndexedDBClient` 测试完整的数据流
   - 测试离线/在线场景

3. **性能测试**
   - 测试大数据集下的查询性能
   - 确保索引正确应用

## 常见问题

### 如何处理事务?

使用仓储的 `transaction` 方法:

```typescript
await userRepository.transaction(async (tx) => {
  await tx.create('users', { name: '张三' });
  await tx.update('profiles', 'profile-123', { active: true });
});
```

### 如何执行批量操作?

使用仓储的 `batch` 方法:

```typescript
await userRepository.batch([
  { type: 'add', data: { name: '张三' } },
  { type: 'add', data: { name: '李四' } },
  { type: 'delete', data: { id: 'user-123' } }
]);
```

### 如何处理异步操作中的错误?

所有仓储方法都返回 Promise，应使用 try/catch 或链式处理:

```typescript
try {
  const user = await userRepository.findById('user-123');
  // 处理结果...
} catch (error) {
  // 处理错误...
}

// 或使用链式处理
userRepository.findById('user-123')
  .then(user => {
    // 处理结果...
  })
  .catch(error => {
    // 处理错误...
  });
```

## 结论

通过实施仓储模式，我们实现了数据访问逻辑与业务逻辑的清晰分离，同时提供了灵活且类型安全的数据访问接口。最近的优化和修复解决了类型不一致和配置问题，进一步提高了系统的稳定性和可维护性。 