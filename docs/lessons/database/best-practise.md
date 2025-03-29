# 数据库架构与实现指南

## 1. 架构概述

项目采用分层架构设计，支持多环境数据存储和同步。本文档与最佳实践指南（`docs/guides/best-practices.md`）配合使用，为团队提供全面的数据库开发参考。

```
src/core/lib/db/
├── clients/          # 数据库客户端实现
│   ├── capacitor-sqlite/  # 移动端SQLite客户端
│   │   ├── sqlite-client.ts       # 主客户端实现
│   │   ├── migration-manager.ts   # 迁移管理
│   │   ├── backup-manager.ts      # 备份管理
│   │   └── performance-manager.ts # 性能管理
│   ├── indexeddb/        # Web端IndexedDB客户端
│   │   ├── indexeddb-client.ts          # 基本实现
│   │   └── optimized-indexeddb-client.ts # 优化实现
│   ├── mock/            # Mock环境实现
│   │   ├── mock-client.ts          # 通用Mock客户端
│   │   └── indexeddb-client.ts     # Mock IndexedDB
│   ├── firebase/        # Firebase客户端
│   ├── hybrid/          # 混合存储客户端
│   ├── sync/            # 同步客户端
│   └── base-client.ts   # 基础客户端抽象
├── repositories/     # 数据访问层
│   ├── base-repository.ts  # 基础仓库
│   ├── user-repository.ts  # 用户数据仓库
│   ├── message-repository.ts # 消息仓库
│   └── match-repository.ts # 匹配仓库
├── schema/          # 数据模型定义
│   ├── definitions/       # 表结构定义
│   ├── adapters/          # ORM适配器
│   ├── version-manager.ts # 版本管理
│   └── versions.ts        # 版本定义
├── types/           # 类型定义
├── test/            # 测试文件
├── interfaces.ts    # 接口定义
├── factory.ts       # 工厂函数
├── config.ts        # 配置管理
└── service.ts       # 核心服务实现
```

## 2. 存储策略

### 2.1 开发阶段（Mock）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=mock`
- 存储类型：Mock IndexedDB（使用 fake-indexeddb）
- 特点：
  - 快速原型验证
  - 预设测试数据
  - 支持完整的 IndexedDB API
  - 可在 Node.js 环境中运行

### 2.2 本地阶段（Local）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=local`
- Web环境：IndexedDB
- 移动端：SQLite
- 特点：支持离线操作，数据持久化

### 2.3 生产阶段（Production）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=production`
- 存储类型：混合存储（本地+云端）
- 云端选项：Firebase/Supabase
- 特点：多设备支持，数据同步

## 3. 数据同步策略

### 3.1 在线优先（Online-First）
- 适用场景：用户注册、个人资料更新
- 特点：优先云端操作，网络不可用时回退本地

### 3.2 离线优先（Offline-First）
- 适用场景：消息、匹配操作
- 特点：优先本地操作，后台同步云端

### 3.3 手动同步（Manual）
- 适用场景：批量数据同步、大文件传输
- 特点：用户主动触发，可控同步过程

## 4. 核心接口

### 4.1 基础客户端接口
```typescript
interface IBaseDatabaseClient {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById<T>(tableName: string, id: string): Promise<T | null>;
  findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create<T>(tableName: string, data: T): Promise<T>;
  update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
}
```

### 4.2 基础仓库接口
```typescript
abstract class BaseRepository<T extends BaseEntity> {
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

  /**
   * 执行原始查询
   * @param query SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  async executeRawQuery<R>(query: string, params: any[] = []): Promise<R[]> {
    return this.client.executeRawQuery<R>(query, params);
  }
}
```

## 5. 数据库升级机制

### 5.1 版本管理
```typescript
interface DatabaseVersion {
  version: number;
  statements: string[];
}

export const databaseVersions: DatabaseVersion[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    ]
  },
  {
    version: 2,
    statements: [
      `ALTER TABLE users ADD COLUMN photoUrl TEXT;`,
      `ALTER TABLE users ADD COLUMN bio TEXT;`,
      `ALTER TABLE users ADD COLUMN interests TEXT;`
    ]
  },
  {
    version: 3,
    statements: [
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'sent',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (receiverId) REFERENCES users(id)
      );`,
      `CREATE INDEX idx_messages_sender ON messages(senderId);`,
      `CREATE INDEX idx_messages_receiver ON messages(receiverId);`
    ]
  },
  {
    version: 4,
    statements: [
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        user1Id TEXT NOT NULL,
        user2Id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        matchedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1Id) REFERENCES users(id),
        FOREIGN KEY (user2Id) REFERENCES users(id)
      );`,
      `CREATE UNIQUE INDEX idx_matches_users ON matches(user1Id, user2Id);`
    ]
  }
];
```

### 5.2 升级流程

```typescript
class VersionManager {
  constructor(private client: IBaseDatabaseClient) {}
  
  async upgradeIfNeeded(): Promise<void> {
    // 1. 检查当前数据库版本
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = databaseVersions.length;
    
    if (currentVersion >= targetVersion) {
      console.log(`数据库已是最新版本: ${currentVersion}`);
      return;
    }
    
    console.log(`开始数据库升级: ${currentVersion} -> ${targetVersion}`);
    
    // 2. 执行升级语句
    await this.client.transaction(async (tx) => {
      for (let i = currentVersion; i < targetVersion; i++) {
        const version = databaseVersions[i];
        console.log(`应用版本 ${version.version} 的迁移...`);
        
        for (const statement of version.statements) {
          await tx.executeRawQuery(statement);
        }
        
        // 3. 更新版本号
        await this.updateVersion(tx, version.version);
      }
    });
    
    // 4. 验证数据完整性
    await this.verifyIntegrity();
    
    console.log(`数据库升级完成: 当前版本 ${targetVersion}`);
  }
  
  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.client.executeRawQuery<{version: number}>(
        'SELECT version FROM schema_version LIMIT 1'
      );
      return result.length > 0 ? result[0].version : 0;
    } catch (error) {
      // 表不存在，创建版本表
      await this.client.executeRawQuery(
        'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)'
      );
      await this.client.executeRawQuery('INSERT INTO schema_version (version) VALUES (0)');
      return 0;
    }
  }
  
  private async updateVersion(tx: IBaseDatabaseClient, version: number): Promise<void> {
    await tx.executeRawQuery(
      'UPDATE schema_version SET version = ?',
      [version]
    );
  }
  
  private async verifyIntegrity(): Promise<void> {
    // 验证表结构
    const tables = await this.getTables();
    const requiredTables = ['users', 'schema_version'];
    
    for (const table of requiredTables) {
      if (!tables.includes(table)) {
        throw new Error(`数据完整性验证失败: 缺少表 ${table}`);
      }
    }
    
    // 可以添加更多验证逻辑
  }
  
  private async getTables(): Promise<string[]> {
    const result = await this.client.executeRawQuery<{name: string}>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return result.map(row => row.name);
  }
}

## 6. 平台特定实现

### 6.1 Web 平台 (IndexedDB)
- 使用 IndexedDB 作为主要存储
- 支持事务和索引
- 异步操作处理

### 6.2 移动平台 (SQLite)
- 使用 Capacitor SQLite 插件
- 原生性能优化
- 文件系统集成

### 6.3 混合存储策略
- 主存储选择
- 备份存储机制
- 数据同步协调

## 7. 错误处理与日志

### 7.1 错误处理策略
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 错误处理示例
try {
  await database.operation();
} catch (error) {
  if (error instanceof DatabaseError) {
    // 处理已知错误
  } else {
    // 处理未知错误
  }
}
```

### 7.2 日志记录
- 操作日志
- 错误日志
- 性能日志

## 8. 最佳实践

### 8.1 数据模型设计
```typescript
// 基础实体接口
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户实体
interface User extends BaseEntity {
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  birthDate?: Date;
}

// 消息实体
interface Message extends BaseEntity {
  senderId: string;
  receiverId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
}

// 匹配实体
interface Match extends BaseEntity {
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'matched' | 'rejected';
  matchedAt?: Date;
}
```

### 8.2 性能优化

#### 批量操作支持
```typescript
// 批量操作接口
interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  data: T | Partial<T> | string; // 完整数据、部分数据或ID
  id?: string; // 用于更新和删除操作
}

// 批量操作示例
async function batchUpdateUsers(users: User[]): Promise<void> {
  const operations: BatchOperation<User>[] = users.map(user => ({
    type: 'update',
    id: user.id,
    data: { name: user.name, email: user.email }
  }));
  
  await userRepository.batch(operations);
}
```

#### 缓存策略
```typescript
class QueryCache<T> {
  private cache: Map<string, { data: T; timestamp: number }>;
  private ttl: number; // 缓存生存时间（毫秒）
  
  constructor(ttl: number = 60000) { // 默认1分钟
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidateAll(): void {
    this.cache.clear();
  }
}

// 使用缓存的仓库示例
class CachedUserRepository extends BaseRepository<User> {
  private cache: QueryCache<User>;
  
  constructor(client: IBaseDatabaseClient) {
    super(client, 'users');
    this.cache = new QueryCache<User>(5 * 60 * 1000); // 5分钟缓存
  }
  
  async findById(id: string): Promise<User | null> {
    // 尝试从缓存获取
    const cacheKey = `user:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 缓存未命中，从数据库获取
    const user = await super.findById(id);
    if (user) {
      this.cache.set(cacheKey, user);
    }
    
    return user;
  }
  
  async update(id: string, data: Partial<User>): Promise<void> {
    await super.update(id, data);
    // 更新后失效相关缓存
    this.cache.invalidate(`user:${id}`);
  }
  
  async delete(id: string): Promise<void> {
    await super.delete(id);
    // 删除后失效相关缓存
    this.cache.invalidate(`user:${id}`);
  }
}
```

#### 延迟加载
```typescript
class UserRepository extends BaseRepository<User> {
  // 基本用户信息查询（不包含大字段）
  async findBasicInfo(id: string): Promise<Omit<User, 'bio' | 'interests'> | null> {
    const query = `
      SELECT id, name, email, photoUrl, birthDate, createdAt, updatedAt 
      FROM users 
      WHERE id = ?
    `;
    
    const results = await this.executeRawQuery<Partial<User>>(query, [id]);
    return results.length > 0 ? results[0] as any : null;
  }
  
  // 按需加载用户详细信息
  async loadUserDetails(id: string): Promise<{ bio?: string; interests?: string[] } | null> {
    const query = `
      SELECT bio, interests 
      FROM users 
      WHERE id = ?
    `;
    
    const results = await this.executeRawQuery<{ bio?: string; interests?: string }>(query, [id]);
    if (results.length === 0) return null;
    
    const result = results[0];
    return {
      bio: result.bio,
      interests: result.interests ? JSON.parse(result.interests) : []
    };
  }
}

// 使用示例
async function renderUserProfile(userId: string) {
  // 先加载基本信息（快速显示）
  const basicInfo = await userRepository.findBasicInfo(userId);
  if (!basicInfo) return null;
  
  // 渲染基本信息
  renderBasicProfile(basicInfo);
  
  // 异步加载详细信息
  userRepository.loadUserDetails(userId).then(details => {
    if (details) {
      // 渲染详细信息
      renderUserDetails(details);
    }
  });
}
```

## 9. 开发流程

1. **环境设置**
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   bun run dev --env-file=.env.local
   
   # 生产环境
   bun run build
   bun run start
   ```

2. **添加新表**
   - 定义表结构
   - 创建仓库类
   - 实现同步逻辑

3. **测试验证**
   - 单元测试
   - 同步测试
   - 性能测试

## 10. 注意事项

1. **数据一致性**
   - 使用事务
   - 冲突解决
   - 数据备份

2. **性能考虑**
   - 合理索引
   - 数据分页
   - 查询优化

3. **安全性**
   - 数据加密
   - 访问控制
   - 安全审计

## 11. 测试策略与最佳实践

### 11.1 测试环境配置

```typescript
// 配置测试环境
const testConfig: DatabaseConfig = {
  name: 'test-db',
  version: 1,
  engine: 'indexeddb',
  offline: {
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    maxEntitiesPerTable: 10000,
    compressionEnabled: true,
    encryptionEnabled: true
  },
  schema: [
    {
      name: 'test_entities',
      columns: [
        { name: 'id', type: 'string', primaryKey: true },
        { name: 'userId', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedAt', type: 'date' }
      ],
      indexes: [
        { name: 'userId_idx', columns: ['userId'] }
      ]
    }
  ]
};
```

### 11.2 边界条件测试

```typescript
describe('IndexedDBClient Boundary Tests', () => {
  // 测试极限数据量
  it('should handle maximum storage limit', async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      largeContent: 'x'.repeat(1024 * 10) // 10KB 数据
    }));
    
    // 批量写入接近限制的数据
    await client.batchCreate('test_table', largeData);
    
    // 验证数据完整性
    const results = await client.findAll('test_table');
    expect(results.length).toBe(1000);
  });
  
  // 测试异常输入
  it('should handle invalid input gracefully', async () => {
    // 测试空值
    await expect(client.create('test_table', null))
      .rejects.toThrow(ValidationError);
      
    // 测试无效ID
    await expect(client.findById('test_table', ''))
      .rejects.toThrow(ValidationError);
      
    // 测试超长字符串
    const veryLongString = 'x'.repeat(1024 * 1024 * 5); // 5MB 字符串
    await expect(client.create('test_table', { id: '1', data: veryLongString }))
      .rejects.toThrow(DatabaseError);
  });
});
```

### 11.3 性能测试

```typescript
describe('Performance Tests', () => {
  // 批量操作性能测试
  it('should perform batch operations efficiently', async () => {
    const startTime = performance.now();
    
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: `perf-${i}`,
      value: i,
      data: `data-${i}`
    }));
    
    await client.batchCreate('perf_table', items);
    
    const endTime = performance.now();
    console.log(`批量创建1000条记录耗时: ${endTime - startTime}ms`);
    
    // 性能断言
    expect(endTime - startTime).toBeLessThan(1000); // 应小于1秒
  });
  
  // 并发查询测试
  it('should handle concurrent queries', async () => {
    const queries = Array.from({ length: 100 }, (_, i) => 
      client.findById('perf_table', `perf-${i % 10}`)
    );
    
    const startTime = performance.now();
    await Promise.all(queries);
    const endTime = performance.now();
    
    console.log(`100个并发查询耗时: ${endTime - startTime}ms`);
    expect(endTime - startTime).toBeLessThan(500); // 应小于500ms
  });
  
  // 内存使用监控
  it('should monitor memory usage', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 执行内存密集型操作
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i.toString(),
      data: `data-${i}`.repeat(100)
    }));
    
    await client.batchCreate('memory_test', largeArray);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiff = (finalMemory - initialMemory) / (1024 * 1024);
    
    console.log(`内存增长: ${memoryDiff.toFixed(2)}MB`);
    // 确保内存增长在合理范围内
    expect(memoryDiff).toBeLessThan(100); // 应小于100MB
  });
});
```

### 11.4 用户行为模拟

```typescript
class UserBehaviorSimulator {
  // 模拟用户会话
  async simulateUserSession(session: UserSession): Promise<void> {
    // 随机执行用户操作
    const actions = [
      this.simulateDataRead,
      this.simulateDataWrite,
      this.simulateDataUpdate,
      this.simulateDataDelete
    ];
    
    // 模拟随机操作序列
    for (let i = 0; i < 10; i++) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      await randomAction.call(this, session);
      
      // 模拟用户思考时间
      await this.wait(Math.random() * 1000);
    }
  }
  
  // 模拟网络条件变化
  async simulateNetworkConditions(): Promise<void> {
    // 模拟网络延迟
    this.setNetworkConditions({
      latency: Math.random() * 200, // 0-200ms延迟
      jitter: Math.random() * 50,  // 0-50ms抖动
      bandwidth: 1000 * (1 + Math.random()), // 1-2Mbps带宽
      packetLoss: Math.random() * 0.05 // 0-5%丢包率
    });
    
    // 模拟网络中断
    if (Math.random() < 0.1) { // 10%概率发生网络中断
      await this.simulateNetworkFailure();
    }
  }
  
  // 模拟设备切换
  async simulateDeviceSwitch(userId: string): Promise<void> {
    const oldDeviceId = faker.string.uuid();
    const newDeviceId = faker.string.uuid();
    
    // 在旧设备上执行操作
    await this.simulateUserOperations(userId, oldDeviceId);
    
    // 模拟切换到新设备
    await this.simulateSessionTransfer(userId, oldDeviceId, newDeviceId);
    
    // 在新设备上执行操作
    await this.simulateUserOperations(userId, newDeviceId);
    
    // 验证数据同步
    await this.verifyDataConsistency(userId);
  }
}
```

### 11.5 压力测试

```typescript
describe('Stress Tests', () => {
  it('should handle high concurrency', async () => {
    const userCount = 100;
    const operationsPerUser = 50;
    
    // 模拟多用户并发操作
    const userPromises = Array.from({ length: userCount }, async (_, i) => {
      const userId = `user-${i}`;
      
      // 每个用户执行多次操作
      for (let j = 0; j < operationsPerUser; j++) {
        // 随机选择操作类型
        const opType = Math.floor(Math.random() * 4); // 0:读, 1:写, 2:更新, 3:删除
        
        switch (opType) {
          case 0: // 读操作
            await client.findById('stress_test', `${userId}-${j % 10}`);
            break;
          case 1: // 写操作
            await client.create('stress_test', {
              id: `${userId}-${j}`,
              data: `Data for ${userId} operation ${j}`
            });
            break;
          case 2: // 更新操作
            await client.update('stress_test', `${userId}-${j % 10}`, {
              data: `Updated data for ${userId} operation ${j}`
            });
            break;
          case 3: // 删除操作
            await client.delete('stress_test', `${userId}-${j % 10}`);
            break;
        }
      }
    });
    
    // 等待所有用户操作完成
    await Promise.all(userPromises);
    
    // 验证数据库状态
    const finalCount = await client.count('stress_test');
    console.log(`压力测试后记录数: ${finalCount}`);
  });
});
```

## 12. 常见问题

1. **离线数据同步**
   - 同步队列
   - 断点续传
   - 网络异常处理

2. **数据迁移**
   - 版本控制
   - 向后兼容
   - 数据验证

3. **性能优化**
   - 缓存策略
   - 批量操作
   - 延迟加载

## 12. 构建与部署

### 12.1 构建脚本
```json
{
  "scripts": {
    "build:web": "next build",
    "build:ios": "next build && npx cap sync ios",
    "build:android": "next build && npx cap sync android",
    "ios:start": "npm run build:ios && npx cap open ios",
    "android:start": "npm run build:android && npx cap open android"
  }
}
```

### 12.2 平台特定配置
- iOS 安全区域适配
- Android 权限管理
- Web 缓存策略



