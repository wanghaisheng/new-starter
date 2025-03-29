# 数据库开发工作流程

## 1. 概述

本文档描述了从开发到生产环境的数据库演进策略，包括Mock数据、本地数据库和生产环境数据库三个阶段。

### 1.1 三阶段开发流程

| 阶段 | 环境变量 | 主要目的 | 关注点 |
|------|---------|---------|--------|
| Mock数据 | NEXT_PUBLIC_DATABASE_ENV=mock | 需求确认与快速原型 | 数据结构、字段定义、关联关系 |
| 本地数据库 | NEXT_PUBLIC_DATABASE_ENV=local | 功能验证与性能测试 | 数据持久化、查询性能、事务处理 |
| 生产环境 | NEXT_PUBLIC_DATABASE_ENV=production | 正式部署与多用户支持 | 安全性、可扩展性、数据同步 |

### 1.2 无缝切换原则

为确保在三个阶段间无缝切换，应遵循以下原则：

1. **统一接口设计**：所有数据库服务实现相同的接口
2. **配置驱动切换**：通过环境变量控制数据库类型
3. **优雅降级策略**：高级环境配置缺失时自动降级到基础环境
4. **数据模型一致性**：确保所有环境使用相同的数据模型

## 2. 开发阶段

### 2.1 Mock数据阶段

#### 目的
- 快速开发和测试UI组件
- 验证业务逻辑
- 不依赖实际数据库环境

#### 实现方式
1. 在`src/mock/data/`目录下创建JSON格式的模拟数据
2. 实现Mock数据服务，提供与真实服务相同的接口
3. 在`.env.development`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=mock
   NEXT_PUBLIC_MOCK_DB_TYPE=memory  # 或 json
   ```

#### 验收标准
- [ ] Mock数据服务接口完整
- [ ] 数据结构符合设计规范
- [ ] 测试用例覆盖主要场景

### 2.2 本地数据库阶段

#### 目的
- 实现本地数据持久化
- 测试数据库操作性能
- 验证数据模型设计

#### 实现方式
1. 设计数据库Schema
2. 创建数据库迁移脚本
3. 实现本地数据库服务
4. 在`.env.local`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=local
   NEXT_PUBLIC_LOCAL_DB_TYPE=sqlite  # 或 indexeddb
   ```

#### 验收标准
- [ ] 数据库Schema设计合理
- [ ] 迁移脚本可重复执行
- [ ] CRUD操作性能达标

## 3. 生产环境阶段

### 3.1 云端数据库

#### 目的
- 实现数据云端存储
- 支持多用户访问
- 确保数据安全性

#### 实现方式
1. 选择云端数据库服务：
   - Firebase Realtime Database/Firestore
   - Supabase
   - Cloudflare D1

2. 在`.env.production`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=production
   NEXT_PUBLIC_CLOUD_DB_TYPE=supabase  # 或 firebase, cloudflare_d1
   NEXT_PUBLIC_CLOUD_DB_URL=your_db_url
   NEXT_PUBLIC_CLOUD_DB_KEY=your_db_key
   ```

3. 实现云端数据库服务：
   ```typescript
   // src/core/lib/db/cloud/cloud-database-service.ts
   export class CloudDatabaseService {
     constructor(private config: CloudConfig) {}
     
     async connect(): Promise<void> {
       // 实现数据库连接
     }
     
     async query<T>(sql: string, params: any[]): Promise<T[]> {
       // 实现查询操作
     }
     
     async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
       // 实现事务操作
     }
   }
   ```

#### 验收标准
- [ ] 数据库连接稳定可靠
- [ ] 查询性能满足要求
- [ ] 数据安全性符合标准

### 3.2 离线数据存储

#### 目的
- 支持离线数据访问
- 实现数据本地缓存
- 确保数据同步机制

#### 实现方式
1. 根据平台选择合适的存储方案：
   - 移动端：Capacitor SQLite
   - Web端：IndexedDB/LocalStorage

2. 在`.env.production`中配置：
   ```
   # 离线存储配置
   NEXT_PUBLIC_OFFLINE_STORAGE_TYPE=indexeddb  # 可选: capacitor-sqlite, indexeddb, localstorage, websql
   NEXT_PUBLIC_OFFLINE_STORAGE_NAME=app_db
   NEXT_PUBLIC_OFFLINE_STORAGE_VERSION=1
   ```

3. 实现离线存储服务：
   ```typescript
   // src/core/lib/db/offline/offline-database-service.ts
   export class OfflineDatabaseService {
     constructor(private config: OfflineConfig) {}
     
     async initialize(): Promise<void> {
       // 初始化数据库
     }
     
     async save<T>(key: string, data: T): Promise<void> {
       // 保存数据
     }
     
     async get<T>(key: string): Promise<T | null> {
       // 获取数据
     }
   }
   ```

#### 验收标准
- [ ] 离线数据访问正常
- [ ] 数据同步机制可靠
- [ ] 存储性能满足要求

### 3.3 数据同步服务

#### 目的
- 确保云端和本地数据一致性
- 处理数据冲突
- 优化同步性能

#### 实现方式
1. 实现数据同步服务：
   ```typescript
   // src/core/lib/db/sync/data-sync-service.ts
   export class DataSyncService {
     constructor(
       private cloudDb: CloudDatabaseService,
       private offlineDb: OfflineDatabaseService
     ) {}
     
     async sync(): Promise<void> {
       // 实现数据同步逻辑
     }
     
     async resolveConflict(local: any, remote: any): Promise<any> {
       // 实现冲突解决策略
     }
   }
   ```

2. 配置同步策略：
   - 定时同步
   - 网络恢复时同步
   - 手动触发同步

#### 验收标准
- [ ] 数据同步机制可靠
- [ ] 冲突解决策略合理
- [ ] 同步性能满足要求

## 4. 数据库工厂

### 4.1 工厂实现
```typescript
// src/core/lib/db/factory.ts
import { Capacitor } from '@capacitor/core'

export function createDatabaseClient(engine: DatabaseEngine) {
  // 移动端优先使用SQLite
  if (Capacitor.isNativePlatform() && engine === 'indexeddb') {
    engine = 'sqlite'
  }

  switch (engine) {
    case 'mock':
      return new MockDatabaseClient(process.env.MOCK_DB_TYPE)
    case 'indexeddb':
      return new IndexedDBClient(process.env.INDEXEDDB_NAME)
    case 'sqlite':
      return new SQLiteClient({
        encryptionKey: process.env.SQLITE_ENCRYPTION_KEY
      })
    case 'supabase':
      return new SupabaseClient({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      })
    // 其他数据库实现...
  }
}
```

### 4.2 使用示例
```typescript
// src/core/lib/db/index.ts
const db = createDatabaseClient(process.env.NEXT_PUBLIC_DATABASE_ENV)

export default db
```

## 5. Repository模式实现

### 5.1 Repository模式概述

Repository模式是一种数据访问模式，它在领域模型和数据映射层之间提供了一个中间层，使得应用程序可以独立于底层数据存储技术。在我们的项目中，Repository模式的实现基于以下原则：

1. **单一职责**：每个Repository只负责一种实体类型的数据访问
2. **接口一致性**：所有Repository实现相同的基础接口
3. **业务逻辑隔离**：数据访问逻辑与业务逻辑分离
4. **可测试性**：便于单元测试和模拟

### 5.2 基础Repository实现

```typescript
// src/core/lib/db/repositories/base-repository.ts
import { IBaseDatabaseClient, QueryOptions } from '../interfaces';
import { BatchOperation, QueryResult, BaseEntity } from '../types';

/**
 * 基础仓储抽象类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {}
  
  /**
   * 根据ID查找实体
   * @param id 实体ID
   * @returns 找到的实体或null
   */
  async findById(id: string): Promise<T | null> {
    return this.client.findById<T>(this.tableName, id);
  }
  
  /**
   * 查找所有实体
   * @param filter 过滤条件
   * @returns 实体列表
   */
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    return this.client.findAll<T>(this.tableName, filter);
  }
  
  /**
   * 创建实体
   * @param data 实体数据
   * @returns 创建的实体
   */
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    return this.client.create<T>(this.tableName, data as T);
  }
  
  /**
   * 更新实体
   * @param id 实体ID
   * @param data 要更新的数据
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.client.update<T>(this.tableName, id, data);
  }
  
  /**
   * 删除实体
   * @param id 实体ID
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(this.tableName, id);
  }
  
  /**
   * 高级查询
   * @param options 查询选项
   * @returns 查询结果
   */
  async query(options: QueryOptions): Promise<QueryResult<T>> {
    return this.client.query<T>(this.tableName, options);
  }

  /**
   * 批量操作
   * @param operations 批量操作列表
   */
  async batch(operations: BatchOperation<T>[]): Promise<void> {
    await this.client.batch<T>(this.tableName, operations);
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   * @returns 事务执行结果
   */
  async transaction<R>(callback: (tx: IBaseDatabaseClient) => Promise<R>): Promise<R> {
    await this.client.beginTransaction();
    try {
      const result = await callback(this.client);
      await this.client.commitTransaction();
      return result;
    } catch (error) {
      await this.client.rollbackTransaction();
      throw error;
    }
  }
}
```

### 5.3 具体Repository实现示例

```typescript
// src/core/lib/db/repositories/user-repository.ts
import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { User } from '../types';

/**
 * 用户仓储类
 * 处理用户相关的数据访问
 */
export class UserRepository extends BaseRepository<User> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'users');
  }
  
  /**
   * 根据用户名查找用户
   * @param name 用户名
   * @returns 用户列表
   */
  async findByName(name: string): Promise<User[]> {
    return this.query({
      where: { name }
    });
  }
  
  /**
   * 根据兴趣查找用户
   * @param interest 兴趣标签
   * @returns 用户列表
   */
  async findByInterest(interest: string): Promise<User[]> {
    // 这里需要特殊处理，因为interests是数组
    return this.client.query<User>(this.tableName, {
      where: {
        interests: { $contains: interest }
      }
    });
  }
}
```

### 5.4 Repository工厂

```typescript
// src/core/lib/db/repositories/index.ts
import { IBaseDatabaseClient } from '../interfaces';
import { UserRepository } from './user-repository';
import { MessageRepository } from './message-repository';
import { DatingRepository } from './dating.repository';

/**
 * Repository工厂类
 * 负责创建和管理Repository实例
 */
export class RepositoryFactory {
  private static repositories: Map<string, any> = new Map();
  
  /**
   * 获取Repository实例
   * @param client 数据库客户端
   * @param repositoryType Repository类型
   * @returns Repository实例
   */
  static getRepository<T>(client: IBaseDatabaseClient, repositoryType: string): T {
    const key = `${repositoryType}_${client.constructor.name}`;
    
    if (!this.repositories.has(key)) {
      let repository;
      
      switch (repositoryType) {
        case 'user':
          repository = new UserRepository(client);
          break;
        case 'message':
          repository = new MessageRepository(client);
          break;
        case 'dating':
          repository = new DatingRepository(client);
          break;
        default:
          throw new Error(`未知的Repository类型: ${repositoryType}`);
      }
      
      this.repositories.set(key, repository);
    }
    
    return this.repositories.get(key) as T;
  }
}
```

### 5.5 Repository使用示例

```typescript
// 在服务层使用Repository
import { RepositoryFactory } from '@/core/lib/db/repositories';
import { UserRepository } from '@/core/lib/db/repositories/user-repository';
import { createDatabaseClient } from '@/core/lib/db/factory';

async function getUserProfile(userId: string) {
  const dbClient = createDatabaseClient(process.env.NEXT_PUBLIC_DATABASE_ENV);
  const userRepository = RepositoryFactory.getRepository<UserRepository>(dbClient, 'user');
  
  // 使用Repository访问数据
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  return user;
}
```

## 6. 测试策略

### 6.1 单元测试
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

### 6.2 集成测试
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

### 6.3 边界条件测试

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

### 6.4 性能测试

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

### 6.5 用户行为模拟测试

用户行为模拟测试通过模拟真实用户的行为模式，验证系统在实际使用场景下的表现。

```typescript
// test/lib/db/simulators/user-behavior-simulator.ts
export class UserBehaviorSimulator {
  private static instance: UserBehaviorSimulator;
  private activeUsers: Map<string, UserSession> = new Map();
  private networkConditions: NetworkConditions = {
    latency: 0,
    jitter: 0,
    bandwidth: 0,
    packetLoss: 0
  };

  public static getInstance(): UserBehaviorSimulator {
    if (!UserBehaviorSimulator.instance) {
      UserBehaviorSimulator.instance = new UserBehaviorSimulator();
    }
    return UserBehaviorSimulator.instance;
  }

  /**
   * 模拟用户行为
   */
  async simulateUserBehavior(): Promise<void> {
    // 生成随机用户行为
    const actions = [
      this.simulateDataRead,
      this.simulateDataWrite,
      this.simulateDataUpdate,
      this.simulateDataDelete
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    await randomAction.call(this);
  }

  /**
   * 模拟多用户并发操作
   */
  async simulateConcurrentUsers(count: number): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = faker.string.uuid();
      const deviceId = faker.string.uuid();
      const session: UserSession = {
        userId,
        deviceId,
        isActive: true,
        lastActive: new Date(),
        permissions: ['read', 'write']
      };
      this.activeUsers.set(userId, session);
      
      promises.push(
        this.simulateUserSession(session)
      );
    }

    await Promise.all(promises);
  }

  /**
   * 模拟网络条件
   */
  setNetworkConditions(conditions: NetworkConditions): void {
    this.networkConditions = conditions;
  }

  /**
   * 模拟设备切换
   */
  async simulateDeviceSwitch(): Promise<void> {
    // 模拟用户从一个设备切换到另一个设备
    // ...
  }
}
```

## 7. 数据同步冲突解决策略

### 7.1 冲突类型

在多设备、多用户环境下，数据同步冲突是不可避免的。常见的冲突类型包括：

1. **更新冲突**：多个客户端同时更新同一条记录
2. **删除冲突**：一个客户端删除记录，另一个客户端更新该记录
3. **插入冲突**：多个客户端插入具有相同ID的记录
4. **结构冲突**：客户端和服务器的数据结构不一致

### 7.2 冲突解决策略

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
            serverVersion,
            clientVersion,
            userId
          );
          await updateDoc(docRef, resolvedData);
          return resolvedData as T;
        } else {
          // 客户端版本更新或相等，直接保存
          const newData = {