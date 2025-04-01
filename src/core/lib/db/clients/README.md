# 数据库客户端模块

## 概述

本模块提供了一套标准化的数据库客户端实现，用于统一不同数据库后端的接口和行为。这些客户端实现了相同的接口，支持不同数据库引擎，使应用程序能够在不同的存储方案之间无缝切换。

## 标准化方案

所有数据库客户端都遵循以下标准化方案：

### 1. 接口实现

所有客户端都实现了 `IDatabaseClient` 接口，并且继承自 `BaseClient` 抽象基类。这确保了所有客户端具有一致的方法签名和行为。

### 2. 错误处理

采用统一的错误处理机制：

- 使用 `DatabaseError` 类型表示数据库错误
- 通过 `DatabaseErrorCode` 枚举提供标准的错误代码
- 在每个方法中使用 try/catch 结构处理错误
- 正确传递和转换底层数据库错误

### 3. 日志记录

所有客户端使用标准化的日志记录系统：

- 使用 `DatabaseLogger` 类型记录操作和错误
- 支持不同的日志级别（DEBUG, INFO, WARN, ERROR）
- 可配置的日志输出格式和目标

### 4. 事务支持

一致的事务支持机制：

- 通过 `beginTransaction()`, `commitTransaction()`, `rollbackTransaction()` 方法显式管理事务
- 提供 `transaction()` 方法简化事务操作
- 所有客户端都支持事务回滚

### 5. 批处理操作

标准化的批处理操作：

- 通过 `batch()` 方法支持批量操作
- 使用统一的 `BatchOperation` 类型定义批处理操作
- 批处理操作中的错误处理和回滚

### 6. 类型安全

加强类型安全：

- 客户端方法使用泛型支持类型安全
- 减少了不必要的类型断言
- 使用接口定义确保类型兼容性

### 7. 初始化和清理

统一的生命周期管理：

- 所有客户端都需要通过 `initialize()` 方法进行初始化
- 提供 `close()` 方法释放资源
- 通过 `clear()` 方法清空数据库内容

### 8. 事件机制

支持事件系统：

- 通过 `on()` 方法注册事件监听器
- 支持标准的数据库事件（如初始化、关闭、错误等）
- 事件监听器注册返回取消函数

## 可用的客户端实现

本模块提供了以下数据库客户端实现：

### MockDatabaseClient

用于测试和开发环境的内存数据库模拟，支持两种存储模式：

- **内存模式**：数据存储在内存中，应用程序重启后数据丢失
- **JSON文件模式**：数据存储在JSON文件中，应用程序重启后数据保留

详情请参阅 [Mock客户端文档](./mock/README.md)

### MockIndexedDBClient

基于 fake-indexedDB 的模拟 IndexedDB 客户端，特别适用于测试环境：

- 继承自 IndexedDBClient，提供兼容的 API
- 使用 fake-indexedDB 库模拟浏览器的本地离线存储 IndexedDB API
- 专门用于模拟客户端的本地离线存储层，而非远程数据存储
- 自动设置测试环境，便于单元测试和集成测试
- 提供数据重置和清理的辅助方法

详情请参阅 [Mock客户端文档](./mock/README.md)

### IndexedDBClient

基于浏览器 IndexedDB API 的客户端，适用于前端应用的本地离线存储：

- 使用浏览器原生 IndexedDB API 
- 支持索引和复杂查询
- 适用于大量数据的客户端本地离线存储
- 提供缓存优化，提高性能

### SQLiteClient

基于 SQLite 的客户端，适用于桌面和移动应用的本地存储。

### FirebaseClient

基于 Firebase Firestore 的客户端，适用于云数据存储和实时数据同步：

- 支持实时数据更新和监听
- 集成离线持久化功能
- 包含认证和安全规则集成
- 支持云端数据同步

### CapacitorSQLiteClient

使用 Capacitor SQLite 插件的客户端，适用于跨平台移动应用的本地存储。

### CloudflareD1Client

基于 Cloudflare D1 的客户端，适用于边缘计算环境。

### TursoClient

基于 Turso 的客户端，适用于边缘和云数据库。

### TiDBClient

基于 TiDB 的客户端，支持分布式 SQL 数据库。

### HybridClient

支持在线/离线同步的混合客户端，适用于需要离线工作和数据同步的应用。

## 使用示例

以下是一个基本的使用示例：

```typescript
import { MockDatabaseClient } from './mock/mock-client';
import { DatabaseConfig } from '../interfaces';

// 创建数据库配置
const config: DatabaseConfig = {
  name: 'test-db',
  version: 1
};

async function main() {
  // 创建客户端实例
  const db = new MockDatabaseClient(config);
  
  // 初始化数据库
  await db.initialize();
  
  try {
    // 创建用户
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
    
    // 更新用户
    await db.updateUser(user.id, {
      bio: '已更新的简介'
    });
    
    // 查询用户
    const updatedUser = await db.findById('users', user.id);
    console.log('更新后的用户:', updatedUser);
    
    // 使用事务
    await db.transaction(async (tx) => {
      await tx.create('messages', {
        id: '1',
        userId: user.id,
        content: '测试消息',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    // 批处理操作
    await db.batch('users', [
      {
        type: 'add',
        data: {
          id: 'user2',
          name: 'Jane Smith',
          // ... 其他必需字段
        }
      },
      {
        type: 'delete',
        data: { id: 'user2' }
      }
    ]);
    
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

main().catch(console.error);
```

## 测试和开发环境

对于测试和开发环境，可以使用不同的模拟客户端：

```typescript
// 内存模式（适用于单元测试，模拟远程数据存储）
const memoryDb = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'memory'
});

// JSON文件模式（适用于集成测试和开发环境，模拟远程数据存储）
const jsonDb = new MockDatabaseClient({
  name: 'test-db',
  version: 1,
  mockMode: 'json',
  jsonFilePath: './data/test-db.json',
  autoSave: true
});

// Mock IndexedDB（适用于模拟客户端本地离线存储的测试）
const mockIndexedDb = new MockIndexedDBClient({
  name: 'test-indexeddb',
  version: 1
});

// 使用 mock IndexedDB 进行测试
await mockIndexedDb.initialize();
await mockIndexedDb.createUser({ /* 用户数据 */ });
// 测试后重置
await mockIndexedDb.reset();
```

## 扩展和定制

如果需要实现自定义数据库客户端，应该遵循以下步骤：

1. 继承 `BaseClient` 抽象基类
2. 实现 `IDatabaseClient` 接口中定义的所有方法
3. 使用标准的错误处理和日志记录机制
4. 实现事务和批处理支持
5. 添加适当的文档注释（JSDoc）

## 贡献指南

向该模块贡献新的数据库客户端实现时，请确保：

1. 遵循上述标准化方案
2. 提供全面的单元测试，确保与其他客户端行为一致
3. 添加详细的文档，包括特定于该客户端的配置和限制
4. 参考现有实现作为模板，保持一致的代码风格和结构

## 性能考虑

所有客户端实现都应该考虑性能优化：

1. 实现适当的缓存机制
2. 使用索引优化查询性能
3. 支持批量操作以减少网络往返
4. 实现指标收集，帮助识别性能瓶颈

