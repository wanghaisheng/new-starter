# FirebaseClient

FirebaseClient 是一个基于 Firebase Firestore 的高性能数据库客户端实现，提供实时数据访问、离线支持和云存储功能。它实现了 `IDatabaseClient` 接口，提供了完整的 CRUD 操作、事务支持、批量操作、实时监听和丰富的查询功能。


 
## 主要特性

- **完整的 CRUD 操作支持**：标准的创建、读取、更新和删除操作
- **实时数据同步**：通过 RealtimeListener 支持文档和集合的实时更新
- **高级查询**：支持复杂的过滤条件、排序和分页
- **离线模式**：自动处理离线状态和数据同步
- **批量操作**：通过 BatchProcessor 解决 Firestore 500 条记录限制
- **事务支持**：完整的事务支持，确保数据操作的原子性
- **性能监控**：内置的性能测量和事件触发机制
- **统一错误处理**：标准化的错误处理和日志记录
- **类型安全**：完全支持 TypeScript 类型系统
- **云集成**：与 Firebase 其他服务的无缝集成

## 辅助类

FirebaseClient 使用多个专门的辅助类来增强功能：

- **RealtimeListener**：管理实时数据订阅，简化文档和集合变更监听
- **FirebaseQueryBuilder**：将标准查询选项转换为 Firestore 查询约束
- **FirebaseOfflineManager**：管理在线/离线状态和数据同步
- **FirebaseBatchProcessor**：处理大型数据集的批量操作，解决 Firestore 的 500 记录限制

## 配置选项

FirebaseClient 支持以下配置选项：

```typescript
interface FirebaseConfig extends Omit<DatabaseConfig, 'offline'> {
  // Firebase 应用配置
  firebaseOptions: FirebaseOptions;
  
  // Firestore 数据库名称，默认为 '(default)'
  databaseName?: string;
  
  // 持久化选项
  persistence?: {
    enabled: boolean;            // 是否启用持久化
    multiTabSupport: boolean;    // 是否启用多标签页支持
    cacheSizeBytes: number | null; // 缓存大小限制
  };
  
  // 认证选项
  auth?: {
    enabled: boolean;            // 是否启用身份验证
    useEmulator: boolean;        // 是否使用 emulator
    emulatorHost?: string;       // emulator 主机
    emulatorPort?: number;       // emulator 端口
    persistence?: 'local' | 'session' | 'none'; // 用户登录状态持久化
  };
  
  // Firestore 选项
  firestore?: {
    useEmulator: boolean;        // 是否使用 emulator
    emulatorHost?: string;       // emulator 主机
    emulatorPort?: number;       // emulator 端口
    experimentalForceLongPolling?: boolean; // 是否启用长轮询
    autoConvertTimestamps?: boolean; // 自动转换时间戳
    ignoreUndefinedProperties?: boolean; // 忽略未定义字段
  };
  
  // 离线模式选项
  offline: {
    maxStorageSize: number;      // 最大存储大小（字节）
    maxEntitiesPerTable: number; // 每个表的最大实体数量
    compressionEnabled: boolean; // 是否启用压缩
    encryptionEnabled: boolean;  // 是否启用加密
    enabled?: boolean;           // 是否启用离线模式
    maxCacheDocuments?: number;  // 最大缓存文档数量
    cacheDuration?: number;      // 离线缓存过期时间（毫秒）
  };
  
  // 性能监控选项
  performance?: {
    enabled: boolean;            // 是否启用性能监控
    logQueryPerformance?: boolean; // 是否记录查询性能
    slowQueryThreshold?: number; // 慢查询阈值（毫秒）
  };
  
  // 批处理选项
  batch?: {
    batchSize?: number;          // 每批最大操作数量
    autoCommit?: boolean;        // 是否自动提交批处理
    autoCommitThreshold?: number; // 自动提交阈值（操作数量）
  };
}
```

## 使用示例

### 基本使用

```typescript
import { FirebaseClient, FirebaseConfig } from '@/core/lib/db/clients/firebase';

// 创建配置
const config: FirebaseConfig = {
  name: 'my-app-db',
  version: 1,
  engine: 'firebase',
  
  // Firebase 配置（从 Firebase 控制台获取）
  firebaseOptions: {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
  },
  
  // 离线支持配置
  offline: {
    maxStorageSize: 10 * 1024 * 1024, // 10MB
    maxEntitiesPerTable: 1000,
    compressionEnabled: true,
    encryptionEnabled: false,
    enabled: true
  },
  
  // 表结构定义
  tables: {
    users: {
      columns: {
        name: { type: 'string' },
        email: { type: 'string' },
        age: { type: 'number' }
      }
    }
  }
};

// 创建客户端
const firebaseClient = new FirebaseClient(config);

// 初始化
await firebaseClient.initialize();

// 创建用户
const user = await firebaseClient.create('users', {
  name: '张三',
  email: 'zhangsan@example.com',
  age: 28
});

// 查询用户
const users = await firebaseClient.findAll('users', { age: { $gt: 20 } });

// 关闭连接
await firebaseClient.close();
```

### 使用实时监听

```typescript
import { FirebaseClient } from '@/core/lib/db/clients/firebase';

// 假设客户端已经初始化
const client = new FirebaseClient(config);
await client.initialize();

// 访问 RealtimeListener
const { realtimeListener } = client;

// 监听单个文档
const unsubscribe = realtimeListener.addEntityListener(
  'users',
  'user-123',
  (userData) => {
    if (userData) {
      console.log('用户数据更新:', userData);
    } else {
      console.log('用户文档不存在或已删除');
    }
  }
);

// 监听集合
const unsubscribeCollection = realtimeListener.addCollectionListener(
  'users',
  (users) => {
    console.log('用户列表更新:', users);
  }
);

// 取消监听
unsubscribe();
unsubscribeCollection();
```

### 使用批量处理

```typescript
import { FirebaseClient, BatchOperationType } from '@/core/lib/db/clients/firebase';

// 假设客户端已经初始化
const client = new FirebaseClient(config);
await client.initialize();

// 创建批量操作
const operations = [
  {
    type: BatchOperationType.CREATE,
    tableName: 'users',
    id: 'user-1',
    data: { name: '张三', email: 'zhangsan@example.com' }
  },
  {
    type: BatchOperationType.UPDATE,
    tableName: 'users',
    id: 'user-2',
    data: { lastActive: new Date() }
  },
  {
    type: BatchOperationType.DELETE,
    tableName: 'users',
    id: 'user-3'
  }
];

// 执行批量操作
const result = await client.batchProcessor.process(operations);
console.log(`成功: ${result.successCount}, 失败: ${result.failureCount}`);
```

## 性能优化建议

1. **使用正确的查询索引**：在 Firestore 控制台中创建适当的索引以优化查询性能。
2. **最小化监听器数量**：每个监听器都会消耗资源，请只监听必要的数据。
3. **利用批处理操作**：使用 `batchProcessor` 批量处理多个操作以减少网络请求。
4. **实现数据分页**：使用 `limit()` 和游标分页来限制获取的数据量。
5. **合理使用离线模式**：离线缓存可以提高性能，但也会增加存储消耗。

## 局限性

1. Firestore 每个批处理最多支持 500 个操作（使用 `FirebaseBatchProcessor` 可以自动分批处理）。
2. 复合查询有特定的限制（例如，不能在一个查询中混合等于和范围比较）。
3. 不支持传统的 SQL-like JOIN 操作，需要在客户端手动执行连接。
4. 查询不支持 `OR` 条件，需要使用多个查询组合结果。
5. 不支持传统的 SQL-like 聚合函数（如 SUM, AVG 等），需要使用 Firebase Functions 或客户端计算。

## 错误处理

FirebaseClient 使用统一的错误处理机制，所有错误都会被包装成 `DatabaseError` 对象，包含错误代码、消息和详细信息。

```typescript
try {
  await firebaseClient.create('users', userData);
} catch (error) {
  if (error.code === 'ALREADY_EXISTS') {
    console.error('用户已存在');
  } else if (error.code === 'PERMISSION_DENIED') {
    console.error('权限不足');
  } else {
    console.error('操作失败:', error.message);
  }
}
``` 