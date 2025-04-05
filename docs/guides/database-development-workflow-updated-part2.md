# 数据库开发工作流程（续）

## 6. 组件与页面数据访问模式（续）

### 6.1 错误示例（续）

```typescript
// 错误示例：直接导入mock数据
import { getRecommendedUsers } from '@/core/lib/db/models/mock-data';

function DiscoverPage() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // 直接使用mock数据，无法根据环境切换数据源
    const recommendedUsers = getRecommendedUsers();
    setUsers(recommendedUsers);
  }, []);
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 6.2 正确示例

以下是推荐的数据访问方式：

```typescript
// 正确示例：使用数据服务工厂
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { useEffect, useState } from 'react';
import { User } from '@/core/types';

function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // 通过工厂获取服务实例，自动根据环境变量选择合适的实现
        const userService = await DataServiceFactory.getInstance().getUserService();
        const recommendedUsers = await userService.getRecommendedUsers();
        setUsers(recommendedUsers);
        setError(null);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('无法加载推荐用户');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## 7. 测试策略

### 7.1 单元测试

```typescript
// test/lib/db/mock-database.test.ts
describe('MockDatabase', () => {
  it('should handle CRUD operations', async () => {
    const db = createDatabaseClient('mock')
    // 测试CRUD操作
  })
})

// test/lib/db/local/sqlite.test.ts
describe('SQLiteDatabase', () => {
  it('should persist data', async () => {
    const db = createDatabaseClient('sqlite')
    // 测试数据持久化
  })
})
```

### 7.2 集成测试

```typescript
// test/lib/db/sync/data-sync.test.ts
describe('DataSync', () => {
  it('should sync data between cloud and offline storage', async () => {
    const cloudDb = createDatabaseClient('supabase')
    const offlineDb = createDatabaseClient('indexeddb')
    const syncService = new DataSyncService(cloudDb, offlineDb)
    // 测试数据同步
  })
})
```

### 7.3 边界条件测试

边界条件测试用于验证系统在极端情况下的行为，确保系统的稳定性和可靠性。

```typescript
// test/lib/db/clients/indexeddb-client.boundary.test.ts
describe('IndexedDBClient Boundary Tests', () => {
  let client: IndexedDBClient;
  
  beforeEach(async () => {
    client = new IndexedDBClient(dbConfig);
    await client.initialize();
  });

  afterEach(async () => {
    await client.close();
  });

  describe('大对象存储测试', () => {
    it('should handle large objects (>10MB)', async () => {
      // 创建一个超过 10MB 的字符串
      const largeString = 'x'.repeat(11 * 1024 * 1024);
      const entity = {
        id: 'test-1',
        name: 'test',
        largeData: largeString,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 测试创建大对象
      await expect(client.create(tableName, entity)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('并发操作测试', () => {
    it('should handle concurrent operations', async () => {
      // 创建多个并发操作
      const operations = Array.from({ length: 100 }, (_, i) => {
        return client.create(tableName, {
          id: `concurrent-${i}`,
          name: `Test ${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // 并发执行所有操作
      await expect(Promise.all(operations)).resolves.toBeDefined();
      
      // 验证所有实体都已创建
      const entities = await client.findAll(tableName);
      expect(entities.length).toBe(100);
    });
  });
});
```

### 7.4 性能测试

性能测试用于评估系统在不同负载下的响应时间和资源使用情况。

```typescript
// test/lib/db/clients/indexeddb-client.benchmark.test.ts
describe('IndexedDBClient Performance Tests', () => {
  let client: IndexedDBClient;
  
  beforeEach(async () => {
    client = new IndexedDBClient(dbConfig);
    await client.initialize();
  });

  afterEach(async () => {
    await client.close();
  });

  it('should handle bulk inserts efficiently', async () => {
    const startTime = performance.now();
    
    // 批量插入1000条记录
    const entities = Array.from({ length: 1000 }, (_, i) => ({
      id: `perf-${i}`,
      name: `Performance Test ${i}`,
      value: i,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await client.batch(tableName, entities.map(entity => ({
      type: 'create',
      data: entity
    })));
    
    const endTime = performance.now();
    console.log(`批量插入1000条记录耗时: ${endTime - startTime}ms`);
    
    // 验证性能指标
    expect(endTime - startTime).toBeLessThan(5000); // 应在5秒内完成
  });

  it('should handle complex queries efficiently', async () => {
    // 准备测试数据
    // ...
    
    const startTime = performance.now();
    
    // 执行复杂查询
    await client.query(tableName, {
      where: { /* 复杂条件 */ },
      orderBy: ['-createdAt'],
      limit: 100,
      offset: 50
    });
    
    const endTime = performance.now();
    console.log(`复杂查询耗时: ${endTime - startTime}ms`);
    
    // 验证性能指标
    expect(endTime - startTime).toBeLessThan(1000); // 应在1秒内完成
  });
});
```

## 8. 数据同步冲突解决策略

### 8.1 冲突类型

在多设备、多用户环境下，数据同步冲突是不可避免的。常见的冲突类型包括：

1. **更新冲突**：多个客户端同时更新同一条记录
2. **删除冲突**：一个客户端删除记录，另一个客户端更新该记录
3. **插入冲突**：多个客户端插入具有相同ID的记录
4. **结构冲突**：客户端和服务器的数据结构不一致

### 8.2 冲突解决策略

```typescript
// src/core/lib/db/clients/firebase/firebase-conflict.ts
export interface ConflictResolutionStrategy {
  // 服务器优先：使用服务器版本
  SERVER_FIRST: 'SERVER_FIRST';
  // 客户端优先：使用客户端版本
  CLIENT_FIRST: 'CLIENT_FIRST';
  // 合并：合并两个版本
  MERGE: 'MERGE';
  // 自定义：使用自定义合并函数
  CUSTOM: 'CUSTOM';
}

export interface ConflictMetadata {
  version: number;
  lastModified: Date;
  modifiedBy: string;
  changes: string[];
}

export class FirebaseConflictService {
  private readonly VERSION_FIELD = '_version';
  private readonly METADATA_FIELD = '_metadata';

  constructor(
    private db: Firestore,
    private options: ConflictResolutionOptions = {
      strategy: 'SERVER_FIRST',
      maxRetries: 3,
      retryDelay: 1000
    }
  ) {}

  async saveWithConflictResolution<T extends BaseEntity>(
    collectionName: string,
    id: string,
    data: Partial<T>,
    userId: string
  ): Promise<T> {
    let retries = 0;
    while (retries < (this.options.maxRetries || 3)) {
      try {
        const docRef = doc(this.db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // 文档不存在，直接创建
          const newData = {
            ...data,
            [this.VERSION_FIELD]: 1,
            [this.METADATA_FIELD]: {
              version: 1,
              lastModified: serverTimestamp(),
              modifiedBy: userId,
              changes: Object.keys(data)
            }
          };
          await setDoc(docRef, newData);
          return newData as T;
        }

        const serverData = docSnap.data();
        const serverVersion = serverData[this.VERSION_FIELD] || 0;
        const clientVersion = data[this.VERSION_FIELD] || 0;

        if (serverVersion > clientVersion) {
          // 服务器版本更新，需要解决冲突
          const resolvedData = await this.resolveConflict(
            serverData,
            data,
            this.options.strategy || 'SERVER_FIRST'
          );
          
          // 更新版本和元数据
          const newVersion = serverVersion + 1;
          const newData = {
            ...resolvedData,
            [this.VERSION_FIELD]: newVersion,
            [this.METADATA_FIELD]: {
              version: newVersion,
              lastModified: serverTimestamp(),
              modifiedBy: userId,
              changes: Object.keys(data)
            }
          };
          
          // 使用事务确保原子性
          await runTransaction(this.db, async (transaction) => {
            const freshDocSnap = await transaction.get(docRef);
            if (!freshDocSnap.exists()) {
              transaction.set(docRef, newData);
              return;
            }
            
            const freshData = freshDocSnap.data();
            const freshVersion = freshData[this.VERSION_FIELD] || 0;
            
            if (freshVersion !== serverVersion) {
              // 版本已变更，需要重试
              throw new Error('VERSION_CHANGED');
            }
            
            transaction.update(docRef, newData);
          });
          
          return newData as T;
        } else {
          // 客户端版本更新或相同，直接更新
          const newVersion = serverVersion + 1;
          const newData = {
            ...data,
            [this.VERSION_FIELD]: newVersion,
            [this.METADATA_FIELD]: {
              version: newVersion,
              lastModified: serverTimestamp(),
              modifiedBy: userId,
              changes: Object.keys(data)
            }
          };
          
          await updateDoc(docRef, newData);
          return newData as T;
        }
      } catch (error) {
        if (error.message === 'VERSION_CHANGED') {
          // 版本冲突，重试
          retries++;
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay || 1000));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error(`达到最大重试次数 (${this.options.maxRetries})`);
  }

  private async resolveConflict<T>(
    serverData: any,
    clientData: any,
    strategy: string
  ): Promise<T> {
    switch (strategy) {
      case 'SERVER_FIRST':
        return { ...clientData, ...serverData };
      case 'CLIENT_FIRST':
        return { ...serverData, ...clientData };
      case 'MERGE':
        return this.mergeData(serverData, clientData);
      case 'CUSTOM':
        if (this.options.customResolver) {
          return this.options.customResolver(serverData, clientData);
        }
        throw new Error('未提供自定义冲突解决器');
      default:
        return { ...clientData, ...serverData }; // 默认服务器优先
    }
  }

  private mergeData(serverData: any, clientData: any): any {
    const result = { ...serverData };
    
    // 合并简单字段
    for (const key in clientData) {
      if (key === this.VERSION_FIELD || key === this.METADATA_FIELD) {
        continue; // 跳过版本和元数据字段
      }
      
      if (!(key in serverData)) {
        // 服务器没有此字段，使用客户端值
        result[key] = clientData[key];
      } else if (typeof clientData[key] === 'object' && clientData[key] !== null) {
        // 对象类型，递归合并
        if (Array.isArray(clientData[key])) {
          // 数组类型，合并并去重
          result[key] = [...new Set([...serverData[key] || [], ...clientData[key]])];
        } else {
          // 对象类型，递归合并
          result[key] = this.mergeData(serverData[key] || {}, clientData[key]);
        }
      } else {
        // 简单类型，使用客户端值（假设客户端更新更重要）
        result[key] = clientData[key];
      }
    }
    
    return result;
  }
}
```

## 9. 开发工作流程检查清单

### 9.1 数据库开发前

- [ ] 确定数据模型和关系
- [ ] 设计表结构和索引
- [ ] 确定数据访问模式
- [ ] 评估性能需求

### 9.2 Mock数据阶段

- [ ] 创建模拟数据文件
- [ ] 实现Mock数据服务
- [ ] 编写单元测试
- [ ] 验证UI和业务逻辑

### 9.3 本地数据库阶段

- [ ] 创建表结构定义
- [ ] 实现数据库迁移脚本
- [ ] 实现本地数据库服务
- [ ] 测试数据持久化和查询性能

### 9.4 生产环境数据库阶段

- [ ] 配置云端数据库服务
- [ ] 实现数据同步策略
- [ ] 测试多用户并发访问
- [ ] 优化性能和安全性

## 10. 常见问题与解决方案

| 问题类别 | 问题描述 | 解决方案 |
|---------|---------|----------|
| 环境配置 | 环境变量未正确加载 | 1. 检查`.env`文件是否存在<br>2. 确保使用正确的环境变量前缀<br>3. 重启开发服务器 |
| 数据库 | Firebase初始化错误 | 1. 检查环境变量配置<br>2. 确保服务实现了优雅降级策略<br>3. 参考[数据库初始化与降级策略](../lessons/database/firebase-initialization-fallback.md) |
| 数据库 | 环境切换后数据丢失 | 1. 使用`--env-file`参数指定正确的环境文件<br>2. 确保数据同步服务正常工作<br>3. 检查数据库连接配置 |
| 数据库 | 表结构变更导致应用崩溃 | 1. 实现版本迁移策略<br>2. 使用Schema Registry管理表结构<br>3. 添加表结构验证逻辑 |
| 数据同步 | 离线数据无法同步到云端 | 1. 检查网络连接状态<br>2. 确保同步队列正常工作<br>3. 查看同步日志定位问题 |
| 性能问题 | 查询响应时间过长 | 1. 添加适当的索引<br>2. 优化查询条件<br>3. 实现数据缓存策略 |

## 11. 结论

本文档详细描述了项目的数据库开发工作流程，从Mock数据阶段到生产环境数据库阶段，提供了完整的指导和最佳实践。通过遵循这些规范和流程，可以确保数据库开发的一致性、可靠性和可维护性，为应用程序提供稳定的数据访问层。