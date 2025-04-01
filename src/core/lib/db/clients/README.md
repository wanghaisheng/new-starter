# 数据库客户端（Database Clients）

## 概述

数据库客户端模块提供了与各种数据库系统交互的标准化接口。这些客户端实现遵循共同的接口规范，使应用程序能够轻松切换不同的数据库后端，而无需更改业务逻辑代码。

## 目录结构

- `base-client.ts` - 所有客户端实现的基类
- `capacitor-sqlite/` - Capacitor SQLite客户端，用于移动应用的离线存储
- `cloudflare/` - Cloudflare D1数据库客户端
- `demo/` - 用于演示的简化客户端
- `firebase/` - Firebase Firestore客户端
- `hybrid/` - 混合客户端，支持在线/离线同步
- `indexeddb/` - 浏览器IndexedDB客户端
- `mock/` - 模拟数据库客户端，用于测试和开发
- `sqlite/` - 通用SQLite数据库客户端
- `sync/` - 支持数据同步的客户端
- `tidb/` - TiDB云数据库客户端
- `turso/` - Turso数据库客户端

## 使用方法

所有客户端实现都遵循`IDatabaseClient`接口。基本用法如下：

```typescript
// 创建客户端实例
const client = new MockDatabaseClient({
  name: "test-db",
  version: 1
});

// 初始化连接
await client.initialize();

// 执行数据库操作
const user = await client.findById("users", "user-1");
const newUser = await client.create("users", { name: "New User" });

// 关闭连接
await client.close();
```

## 客户端选择指南

- **开发和测试环境**: 使用`MockDatabaseClient`
- **浏览器环境**: 使用`IndexedDBClient`
- **移动应用**: 使用`CapacitorSQLiteClient`
- **生产后端**: 根据需求选择`SQLiteClient`、`TiDBClient`、`TursoClient`或`CloudflareClient`
- **需要实时数据同步**: 使用`FirebaseClient`或`HybridClient`

## 扩展指南

要创建新的数据库客户端实现，请遵循以下步骤：

1. 继承`BaseClient`类
2. 实现`IDatabaseClient`接口中的必要方法
3. 处理特定数据库的连接、查询和事务逻辑
4. 实现适当的错误处理
5. 确保类型安全和完整的文档注释

示例框架：

```typescript
import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';

export class NewDatabaseClient extends BaseClient implements IDatabaseClient {
  constructor(private config: DatabaseConfig) {
    super();
  }
  
  async initialize(): Promise<void> {
    // 实现初始化逻辑
  }
  
  // 实现其他必要方法
}
```

## 最佳实践与经验教训

### 1. 接口一致性

所有客户端实现应该提供一致的接口体验，无论底层数据库系统如何。这包括统一的方法名称、参数和返回类型。

**问题示例**:
```typescript
// 不一致的方法命名和参数
async getUser(id: string): Promise<User>
async findUserById(userId: string): Promise<User>
```

**最佳实践**:
```typescript
// 统一使用 findById 方法
async findById<T>(tableName: string, id: string): Promise<T | null>
```

### 2. 错误处理

采用一致的错误处理策略，使用特定的错误类型提供有用的上下文信息。

**问题示例**:
```typescript
// 不一致的错误处理
try {
  // 数据库操作
} catch (error) {
  console.error(error);
  return null;
}
```

**最佳实践**:
```typescript
// 统一的错误处理
try {
  // 数据库操作
} catch (error) {
  throw new DatabaseError(
    'Failed to find entity', 
    { tableName, id, operation: 'findById' },
    error
  );
}
```

### 3. 事务支持

确保所有客户端一致地实现事务支持，特别是在批量操作中。

**最佳实践**:
```typescript
async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
  await this.beginTransaction();
  try {
    const result = await callback(this);
    await this.commitTransaction();
    return result;
  } catch (error) {
    await this.rollbackTransaction();
    throw error;
  }
}
```

### 4. 类型安全

确保所有客户端实现都提供适当的类型安全，尤其是在处理泛型和数据转换时。

**问题示例**:
```typescript
// 不安全的类型处理
return result as User;
```

**最佳实践**:
```typescript
// 类型安全的数据处理
return this.processResult<User>(result);
```

### 5. 模块化设计

对于具有额外功能的客户端（如Firebase），应使用模块化设计将功能封装到专用服务类中。

**最佳实践**:
```typescript
// 模块化设计示例
export class FirebaseClient implements IDatabaseClient {
  private auth: FirebaseAuthService;
  private permissions: FirebasePermissionsService;
  
  constructor(config: FirebaseConfig) {
    this.auth = new FirebaseAuthService(config);
    this.permissions = new FirebasePermissionsService(config);
  }
  
  // 客户端方法
}
```

### 6. 性能监控

实现性能监控以帮助识别和解决性能瓶颈。

**最佳实践**:
```typescript
async findById<T>(tableName: string, id: string): Promise<T | null> {
  const startTime = performance.now();
  try {
    // 数据库操作
    return result;
  } finally {
    const duration = performance.now() - startTime;
    this.recordQueryMetrics('findById', tableName, duration);
  }
}
```

## 已知问题与限制

- `FirebaseClient` 和 `CloudflareClient` 不支持某些高级SQL特性
- 事务支持在不同客户端间可能有所不同，特别是在分布式数据库中
- 性能特性因底层数据库实现而异

## 未来改进计划

- 统一所有客户端的错误处理和日志记录
- 添加更多性能监控和优化功能
- 改进事务支持和并发控制
- 实现更好的缓存策略

