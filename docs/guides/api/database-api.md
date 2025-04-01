# 数据库 API 文档

## 概述

本文档详细说明了项目中数据库相关的API接口、使用方法和最佳实践。文档基于当前的数据库架构，包括接口定义、客户端实现和仓储模式。

## 1. 核心接口

### 1.1 IBaseDatabaseClient

基础数据库客户端接口，定义了通用的数据访问方法。

```typescript
export interface IBaseDatabaseClient<T extends BaseEntity = BaseEntity> {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById(tableName: string, id: string): Promise<T | null>;
  findAll(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create(tableName: string, data: T): Promise<T>;
  update(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  query(tableName: string, options: QueryOptions): Promise<QueryResult<T>>;
  count(tableName: string, filter?: Record<string, any>): Promise<number>;
  
  // 事务支持
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;

  // 批量操作
  batch(tableName: string, operations: BatchOperation<T>[]): Promise<void>;

  // 原始查询
  executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
}
```

### 1.2 IDatabaseClient

完整数据库客户端接口，继承自`IBaseDatabaseClient`，添加了特定于表的方法。

```typescript
export interface IDatabaseClient extends IBaseDatabaseClient {
  // 用户相关方法
  findUsers(query?: any): Promise<User[]>;
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // 匹配相关方法
  findMatches(query?: any): Promise<Match[]>;
  createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match>;
  updateMatch(id: string, data: Partial<Match>): Promise<void>;
  deleteMatch(id: string): Promise<void>;

  // 消息相关方法
  findMessages(query?: any): Promise<Message[]>;
  createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<void>;
  deleteMessage(id: string): Promise<void>;

  // 事务支持
  transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T>;
}
```

### 1.3 QueryOptions

查询选项接口，用于高级查询。

```typescript
export interface QueryOptions {
  where?: {
    field: string;
    operator: '==' | '<' | '<=' | '>' | '>=' | '!=' | '$in' | '$ne' | '$contains' | '$gt' | '$lt' | '$gte' | '$lte' | '$and' | '$or';
    value: any;
  } | {
    $and?: QueryOptions['where'][];
    $or?: QueryOptions['where'][];
    [key: string]: any;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}
```

## 2. 数据库服务

### 2.1 DatabaseService

数据库服务类是应用程序与数据库交互的主要入口点，管理数据库客户端和仓储实例。

```typescript
export class DatabaseService {
  // 获取单例实例
  public static getInstance(): DatabaseService;
  
  // 生命周期方法
  async initialize(): Promise<void>;
  async close(): Promise<void>;
  async clear(): Promise<void>;
  
  // 获取仓储实例
  getUserRepository(): UserRepository;
  getMatchRepository(): MatchRepository;
  getMessageRepository(): MessageRepository;
  
  // 向后兼容的方法 - 用户相关操作
  async saveUser(user: User): Promise<void>;
  async getUser(id: string): Promise<User | null>;
  async getUsers(): Promise<User[]>;
  async updateUser(user: User): Promise<void>;
  async deleteUser(id: string): Promise<void>;
  
  // 向后兼容的方法 - 匹配相关操作
  async saveMatch(match: Match): Promise<void>;
  async getMatch(id: string): Promise<Match | null>;
  async getMatches(): Promise<Match[]>;
  async getMatchesByUserId(userId: string): Promise<Match[]>;
  async deleteMatch(id: string): Promise<void>;
  
  // 向后兼容的方法 - 消息相关操作
  async saveMessage(message: Message): Promise<void>;
  async getMessage(id: string): Promise<Message | null>;
  async getMessages(matchId: string): Promise<Message[]>;
  async deleteMessage(id: string): Promise<void>;
  
  // 通用查询接口 - 向后兼容
  async query<T>(tableName: string, options: any): Promise<T[]>;
  async findOne<T>(tableName: string, filter: any): Promise<T | null>;
  async insert<T extends { id: string }>(tableName: string, data: T): Promise<T>;
  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  async delete(tableName: string, id: string): Promise<void>;
  
  // 获取原始数据库客户端实例
  getRawClient(): IDatabaseClient;
}
```

### 2.2 使用示例

```typescript
// 获取数据库服务实例
const dbService = DatabaseService.getInstance();

// 初始化数据库
await dbService.initialize();

// 使用仓储模式
const userRepository = dbService.getUserRepository();
const users = await userRepository.findAll();

// 使用向后兼容的方法
const user = await dbService.getUser('user-123');
if (user) {
  user.name = 'New Name';
  await dbService.updateUser(user);
}

// 关闭数据库连接
await dbService.close();
```

## 3. 数据库工厂

### 3.1 DatabaseFactory

数据库工厂类负责创建和管理数据库客户端实例。

```typescript
export class DatabaseFactory {
  // 注册数据库客户端类型
  static registerClientType(type: string, clientClass: any): void;
  
  // 创建数据库客户端
  static createClient(type: string, config?: DatabaseConfig): IDatabaseClient;
  
  // 根据环境变量创建数据库客户端
  static createClientFromEnv(): IDatabaseClient;
}
```

### 3.2 使用示例

```typescript
// 注册自定义客户端类型
DatabaseFactory.registerClientType('custom-client', CustomDatabaseClient);

// 创建特定类型的客户端
const client = DatabaseFactory.createClient('indexeddb', {
  name: 'my-database',
  version: 1,
  engine: 'indexeddb'
});

// 根据环境变量创建客户端
const envClient = DatabaseFactory.createClientFromEnv();
```

## 4. 仓储模式

### 4.1 BaseRepository

基础仓储抽象类，提供通用的CRUD操作。

```typescript
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected client: IBaseDatabaseClient, protected tableName: string);
  
  // 基本CRUD操作
  async findById(id: string): Promise<T | null>;
  async findAll(filter?: Record<string, any>): Promise<T[]>;
  async create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  async update(id: string, data: Partial<T>): Promise<void>;
  async delete(id: string): Promise<void>;
  
  // 高级查询
  async query(options: QueryOptions): Promise<QueryResult<T>>;
  
  // 批量操作
  async batch(operations: BatchOperation<T>[]): Promise<void>;
  
  // 事务支持
  async transaction<R>(callback: (tx: IBaseDatabaseClient) => Promise<R>): Promise<R>;
  
  // 原始查询
  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
}
```

### 4.2 具体仓储类

#### 4.2.1 UserRepository

```typescript
export class UserRepository extends BaseRepository<User> {
  constructor(client: IBaseDatabaseClient);
  
  // 特定查询方法
  async findByName(name: string): Promise<User[]>;
  async findByInterest(interest: string): Promise<User[]>;
  async findRecentlyActive(limit?: number): Promise<User[]>;
}
```

#### 4.2.2 MatchRepository

```typescript
export class MatchRepository extends BaseRepository<Match> {
  constructor(client: IBaseDatabaseClient);
  
  // 特定查询方法
  async findByUserId(userId: string): Promise<Match[]>;
  async findByStatus(status: Match['status']): Promise<Match[]>;
}
```

#### 4.2.3 MessageRepository

```typescript
export class MessageRepository extends BaseRepository<Message> {
  constructor(client: IBaseDatabaseClient);
  
  // 特定查询方法
  async findByMatchId(matchId: string): Promise<Message[]>;
  async findBySenderId(senderId: string): Promise<Message[]>;
  async findUnread(matchId: string): Promise<Message[]>;
}
```

### 4.3 使用示例

```typescript
// 创建仓储实例
const client = DatabaseFactory.createClientFromEnv();
await client.initialize();

const userRepository = new UserRepository(client);

// 基本CRUD操作
const user = await userRepository.findById('user-123');
const allUsers = await userRepository.findAll();

const newUser = await userRepository.create({
  name: 'John Doe',
  email: 'john@example.com',
  birthDate: new Date(1990, 0, 1),
  gender: 'male',
  photos: [],
  interests: ['sports', 'music'],
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  },
  preferences: {
    ageRange: { min: 25, max: 35 },
    distance: 50,
    gender: ['female']
  },
  isVerified: false,
  lastActive: new Date(),
  status: 'active'
});

await userRepository.update('user-123', { name: 'Updated Name' });
await userRepository.delete('user-123');

// 特定查询方法
const usersByName = await userRepository.findByName('John');
const usersByInterest = await userRepository.findByInterest('sports');
const recentUsers = await userRepository.findRecentlyActive(10);
```

## 5. 数据模型

### 5.1 BaseEntity

所有实体的基础接口。

```typescript
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 User

```typescript
export interface User extends BaseEntity {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  photos: Photo[];
  bio?: string;
  interests: string[];
  location: Location;
  preferences: UserPreferences;
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface Photo extends BaseEntity {
  url: string;
  order: number;
  isMain: boolean;
  userId: string;
}

export interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number; // 最大距离（公里）
  gender: ('male' | 'female' | 'other')[];
  interests: string[];
  dealBreakers?: string[];
}
```

### 5.3 Match

```typescript
export interface Match extends BaseEntity {
  users: [string, string]; // 用户ID对
  status: 'pending' | 'matched' | 'rejected';
}

export interface MatchAction extends BaseEntity {
  userId: string;
  targetUserId: string;
  action: 'like' | 'dislike' | 'superlike';
  createdAt: Date;
}
```

### 5.4 Message

```typescript
export interface Message extends BaseEntity {
  matchId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  status: 'sent' | 'delivered' | 'read';
}
```

## 6. 表结构定义

### 6.1 TableSchema

```typescript
export interface ColumnDefinition {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: any;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: {
    name: string;
    columns: string[];
    unique?: boolean;
  }[];
}
```

### 6.2 SchemaRegistry

```typescript
export class SchemaRegistry {
  // 获取单例实例
  public static getInstance(): SchemaRegistry;
  
  // 注册表结构
  public registerSchema(schema: TableSchema): void;
  
  // 获取表结构
  public getSchema(name: string): TableSchema | undefined;
  
  // 获取所有表结构
  public getAllSchemas(): TableSchema[];
}

// 导出单例实例
export const schemaRegistry = SchemaRegistry.getInstance();
```

### 6.3 使用示例

```typescript
// 定义表结构
const userSchema: TableSchema = {
  name: 'users',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'name',
      type: 'string',
      notNull: true
    },
    // 其他列...
  ],
  indexes: [
    {
      name: 'idx_users_email',
      columns: ['email'],
      unique: true
    }
  ]
};

// 注册表结构
schemaRegistry.registerSchema(userSchema);

// 获取表结构
const schema = schemaRegistry.getSchema('users');
```

## 7. 环境配置

### 7.1 环境变量

| 环境变量 | 说明 | 默认值 | 可选值 |
|---------|------|-------|-------|
| NEXT_PUBLIC_DATABASE_ENV | 数据库环境 | mock | mock, local, production |
| NEXT_PUBLIC_MOCK_DB_TYPE | Mock数据库类型 | mock-indexeddb | mock, mock-indexeddb |
| NEXT_PUBLIC_DB_NAME | 数据库名称 | app-database | 任意字符串 |
| NEXT_PUBLIC_DB_VERSION | 数据库版本 | 1 | 任意整数 |

### 7.2 配置示例

```env
# 开发环境 - 使用Mock数据
NEXT_PUBLIC_DATABASE_ENV=mock
NEXT_PUBLIC_MOCK_DB_TYPE=mock-indexeddb
NEXT_PUBLIC_DB_NAME=dev-database
NEXT_PUBLIC_DB_VERSION=1

# 本地环境 - 使用IndexedDB
NEXT_PUBLIC_DATABASE_ENV=local
NEXT_PUBLIC_DB_NAME=local-database
NEXT_PUBLIC_DB_VERSION=1

# 生产环境
NEXT_PUBLIC_DATABASE_ENV=production
NEXT_PUBLIC_DB_NAME=prod-database
NEXT_PUBLIC_DB_VERSION=1
```

## 8. 错误处理

### 8.1 常见错误

| 错误类型 | 说明 | 处理方法 |
|---------|------|--------|
| 初始化错误 | 数据库初始化失败 | 检查环境配置，确保浏览器支持IndexedDB |
| 连接错误 | 无法连接到数据库 | 检查网络连接，确保数据库服务可用 |
| 查询错误 | 查询执行失败 | 检查查询参数，确保表和字段存在 |
| 事务错误 | 事务执行失败 | 检查事务逻辑，确保没有并发冲突 |

### 8.2 错误处理示例

```typescript
try {
  await dbService.initialize();
  const users = await dbService.getUsers();
  // 处理数据...
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('数据库错误:', error.message);
    // 处理数据库错误...
  } else {
    console.error('未知错误:', error);
    // 处理其他错误...
  }
} finally {
  await dbService.close();
}
```

## 9. 最佳实践

### 9.1 初始化和关闭

- 在应用启动时初始化数据库，在应用关闭时关闭数据库
- 使用单例模式管理数据库服务实例
- 确保在使用数据库前完成初始化

```typescript
// 在应用入口点初始化
const dbService = DatabaseService.getInstance();
await dbService.initialize();

// 在应用关闭时关闭
window.addEventListener('beforeunload', async () => {
  await dbService.close();
});
```

### 9.2 事务处理

- 对于多个相关操作，使用事务确保原子性
- 正确处理事务的提交和回滚

```typescript
await userRepository.transaction(async (tx) => {
  // 在事务中执行多个操作
  const user = await tx.findById('users', 'user-123');
  if (user) {
    await tx.update('users', 'user-123', { name: 'New Name' });
    await tx.create('logs', {
      id: generateId(),
      userId: 'user-123',
      action: 'update',
      timestamp: new Date()
    });
  }
  // 事务会自动提交，如果出错会自动回滚
});
```

### 9.3 查询优化

- 使用索引加速查询
- 限制查询结果数量
- 只查询需要的字段

```typescript
// 使用索引加速查询
const users = await userRepository.query({
  where: { email: 'john@example.com' }, // 假设email有索引
  limit: 1
});

// 分页查询
const pageSize = 10;
const pageNumber = 1;
const users = await userRepository.query({
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: pageSize,
  offset: (pageNumber - 1) * pageSize
});
```

### 9.4 错误处理

- 使用 try/catch 捕获和处理错误
- 记录详细的错误信息
- 提供用户友好的错误消息

```typescript
try {
  await userRepository.create(userData);
} catch (error) {
  console.error('创建用户失败:', error);
  // 记录详细错误信息
  logError('create_user_failed', {
    userData,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date()
  });
  // 提供用户友好的错误消息
  throw new Error('无法创建用户，请稍后再试');
}
```

## 10. 常见问题解答

### 10.1 如何添加新表？

1. 在 `schema/definitions/` 目录下创建新的表结构定义文件
2. 在 `types/` 目录下定义新的实体类型
3. 在 `repositories/` 目录下创建新的仓储类
4. 在 `DatabaseService` 中添加获取新仓储的方法

详细步骤请参考 [添加新表指南](../guides/add-new-table.md)。

### 10.2 如何处理数据迁移？

1. 使用 SchemaRegistry 注册新的表结构
2. 使用 DrizzleSchemaAdapter 生成迁移 SQL
3. 在数据库初始化时执行迁移

```typescript
// 生成迁移 SQL
const migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(
  schemaRegistry.getAllSchemas()
);

// 执行迁移
await client.executeRawQuery(migrationSQL);
```

### 10.3 如何在不同环境间切换？

通过设置环境变量 `NEXT_PUBLIC_DATABASE_ENV` 切换不同环境：

- `mock`: 使用模拟数据库，适用于开发和测试
- `local`: 使用本地数据库，适用于本地开发和测试
- `production`: 使用生产环境数据库，适用于生产部署

```typescript
// 根据环境变量创建客户端
const client = DatabaseFactory.createClientFromEnv();
```

### 10.4 如何处理离线数据同步？

使用 SyncClient 处理离线数据同步：

```typescript
// 创建同步客户端
const syncClient = new SyncClient({
  offline: new IndexedDBClient({ name: 'offline-db' }),
  online: new CloudflareD1Client({ name: 'online-db' }),
  syncConfig: {
    strategy: 'periodic',
    interval: 60000, // 每分钟同步一次
    conflictResolution: 'last-write-wins'
  }
});

// 初始化客户端
await syncClient.initialize();

// 使用客户端（会自动同步）
const users = await syncClient.findAll('users');

// 手动触发同步
await syncClient.sync();
```

## 11. 参考资源

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [Capacitor SQLite 插件](https://capacitorjs.com/docs/apis/sqlite)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)