# 数据库开发工作流程

> 版本兼容性：本文档必须与[guideline.md](../../guideline.md) v1.1+ 保持同步  
> 最后同步时间：2025-03-28

## 1. 概述

本文档描述了从开发到生产环境的数据库演进策略，包括Mock数据、本地数据库和生产环境数据库三个阶段。这三个阶段构成了一个连续的开发流程，理想情况下，只需通过切换环境变量即可在不同阶段间无缝切换，而无需修改业务代码。这种设计确保了在开发初期就能确认数据库表字段和关联关系，随后在本地环境进行测试验证，最终无缝过渡到生产环境。

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

## 2. 数据库架构

### 2.1 数据库访问层

项目采用分层架构设计数据库访问层，主要包含以下组件：

```
src/core/lib/db/
├── clients/                # 数据库客户端实现
│   ├── base-client.ts      # 基础客户端抽象类
│   ├── capacitor-sqlite/   # SQLite客户端实现
│   ├── indexeddb/          # IndexedDB客户端实现
│   ├── firebase/           # Firebase客户端实现
│   └── mock/               # 模拟数据客户端
├── repositories/           # 仓储模式实现
│   ├── base-repository.ts  # 基础仓储抽象类
│   ├── user-repository.ts  # 用户仓储
│   ├── match-repository.ts # 匹配仓储
│   └── message-repository.ts # 消息仓储
├── schema/                 # 数据库模式定义
│   ├── definitions/        # 表结构定义
│   │   ├── user-schema.ts  # 用户表结构
│   │   ├── match-schema.ts # 匹配表结构
│   │   └── message-schema.ts # 消息表结构
│   ├── adapters/           # 数据库适配器
│   └── entity-converter.ts # 实体转换器
├── factory.ts              # 数据库工厂
├── service.ts              # 数据库服务
└── types/                  # 类型定义
    ├── base-entity.ts      # 基础实体类型
    ├── database.types.ts   # 数据库类型
    └── dating.ts           # 业务实体类型
```

### 2.2 核心组件

#### 2.2.1 Schema Registry

Schema Registry 负责管理所有表结构定义，提供统一的注册和访问接口：

```typescript
// src/core/lib/db/schema/schema-registry.ts
export class SchemaRegistry implements ISchemaRegistry {
  private static instance: SchemaRegistry;
  private schemas: Map<string, TableSchema>;

  private constructor() {
    this.schemas = new Map();
  }

  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  // 注册表结构
  public register(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
  }

  // 获取表结构
  public getSchema(name: string): TableSchema | undefined {
    return this.schemas.get(name);
  }

  // 获取所有表结构
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }
}
```

#### 2.2.2 数据库工厂

数据库工厂负责创建和管理数据库客户端实例，根据环境变量选择合适的客户端类型：

```typescript
// src/core/lib/db/factory.ts
export class DatabaseFactory {
  private static clientRegistry: Map<string, any> = new Map();
  
  // 注册数据库客户端类型
  static registerClientType(type: string, clientClass: any): void {
    this.clientRegistry.set(type.toLowerCase(), clientClass);
  }
  
  // 创建数据库客户端
  static createClient(type: string, config: DatabaseConfig = { name: 'default', version: 1, engine: 'mock' }): IDatabaseClient {
    const clientClass = this.clientRegistry.get(type.toLowerCase());
    
    if (!clientClass) {
      throw new Error(`未知的数据库客户端类型: ${type}`);
    }
    
    return new clientClass(config);
  }
  
  // 根据环境变量创建数据库客户端
  static createClientFromEnv(): IDatabaseClient {
    // 获取环境变量
    const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    const dbType = process.env.NEXT_PUBLIC_MOCK_DB_TYPE || 'mock-indexeddb';
    const dbName = process.env.NEXT_PUBLIC_DB_NAME || 'app-database';
    const dbVersion = parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10);
    
    // 创建配置
    const config: DatabaseConfig = {
      name: dbName,
      version: dbVersion,
      engine: dbType as any
    };
    
    // 根据环境选择客户端类型
    let clientType = dbType;
    
    // 如果是生产环境，根据平台选择合适的客户端
    if (dbEnv === 'production') {
      if (Capacitor.isNativePlatform()) {
        clientType = DatabaseClientType.CAPACITOR_SQLITE;
      } else {
        clientType = DatabaseClientType.INDEXEDDB;
      }
    }
    
    // 创建客户端
    return this.createClient(clientType, config);
  }
}
```

#### 2.2.3 数据库服务

数据库服务是应用程序与数据库交互的主要入口点，管理数据库客户端和仓储实例：

```typescript
// src/core/lib/db/service.ts
export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private isInitialized = false;
  
  // 仓储实例
  private userRepository: UserRepository;
  private matchRepository: MatchRepository;
  private messageRepository: MessageRepository;

  private constructor() {
    // 使用工厂方法根据环境变量创建客户端
    this.client = DatabaseFactory.createClientFromEnv();
    
    // 初始化仓储
    this.userRepository = new UserRepository(this.client);
    this.matchRepository = new MatchRepository(this.client);
    this.messageRepository = new MessageRepository(this.client);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // 获取仓储实例
  getUserRepository(): UserRepository {
    this.checkInitialized();
    return this.userRepository;
  }
  
  getMatchRepository(): MatchRepository {
    this.checkInitialized();
    return this.matchRepository;
  }
  
  getMessageRepository(): MessageRepository {
    this.checkInitialized();
    return this.messageRepository;
  }
}
```

#### 2.2.4 数据服务工厂

数据服务工厂负责创建和管理数据服务实例，根据环境变量选择合适的服务实现：

```typescript
// src/core/services/data-service-factory.ts
export class DataServiceFactory {
  private static instance: IDataService;

  public static getInstance(): IDataService {
    if (!DataServiceFactory.instance) {
      const databaseEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      
      switch (databaseEnv) {
        case 'mock':
          DataServiceFactory.instance = MockDataService.getInstance();
          break;
        case 'local':
          // 在移动平台使用 SQLite
          if (Capacitor.isNativePlatform()) {
            DataServiceFactory.instance = DatabaseService.getInstance();
          } else {
            // 在 Web 平台使用 IndexedDB
            DataServiceFactory.instance = MockDataService.getInstance();
          }
          break;
        case 'cloud':
          // TODO: 实现云端数据库服务
          DataServiceFactory.instance = MockDataService.getInstance();
          break;
        default:
          throw new Error(`Unsupported database environment: ${databaseEnv}`);
      }
    }
    return DataServiceFactory.instance;
  }
}
```

### 2.3 Repository模式

Repository模式是一种数据访问模式，它在领域模型和数据映射层之间提供了一个中间层，使得应用程序可以独立于底层数据存储技术。在我们的项目中，Repository模式的实现基于以下原则：

1. **单一职责**：每个Repository只负责一种实体类型的数据访问
2. **接口一致性**：所有Repository实现相同的基础接口
3. **业务逻辑隔离**：数据访问逻辑与业务逻辑分离
4. **可测试性**：便于单元测试和模拟

#### 2.3.1 基础Repository实现

```typescript
// src/core/lib/db/repositories/base-repository.ts
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {}
  
  // 根据ID查找实体
  async findById(id: string): Promise<T | null> {
    return this.client.findById<T>(this.tableName, id);
  }
  
  // 查找所有实体
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    return this.client.findAll<T>(this.tableName, filter);
  }
  
  // 创建实体
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    return this.client.create<T>(this.tableName, data as T);
  }
  
  // 更新实体
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.client.update<T>(this.tableName, id, data);
  }
  
  // 删除实体
  async delete(id: string): Promise<void> {
    await this.client.delete(this.tableName, id);
  }
  
  // 高级查询
  async query(options: QueryOptions): Promise<QueryResult<T>> {
    return this.client.query<T>(this.tableName, options);
  }

  // 批量操作
  async batch(operations: BatchOperation<T>[]): Promise<void> {
    await this.client.batch<T>(this.tableName, operations);
  }

  // 执行事务
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

#### 2.3.2 具体Repository实现示例

```typescript
// src/core/lib/db/repositories/user-repository.ts
export class UserRepository extends BaseRepository<User> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'users');
  }
  
  // 根据用户名查找用户
  async findByName(name: string): Promise<User[]> {
    return this.query({
      where: { name }
    });
  }
  
  // 根据兴趣查找用户
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

## 3. 开发阶段

### 3.1 Mock数据阶段

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

### 3.2 本地数据库阶段

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

### 3.3 生产环境数据库阶段

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

3. 实现云端数据库服务

#### 验收标准
- [ ] 数据库连接稳定可靠
- [ ] 查询性能满足要求
- [ ] 数据安全性符合标准

### 3.4 离线数据存储

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

#### 验收标准
- [ ] 离线数据访问正常
- [ ] 数据同步机制可靠
- [ ] 存储性能满足要求

## 4. 环境切换与错误处理

为确保在不同数据库环境之间平滑切换，请遵循以下最佳实践：

### 4.1 环境切换

在开发过程中，可以通过以下方式在不同数据库环境之间切换：

1. **环境变量文件**：
   - `.env.development` - 开发环境（默认包含 mock 配置）
   - `.env.local` - 本地开发环境
   - `.env.production` - 生产环境

2. **启动命令**：
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   NODE_ENV=local bun run dev
   
   # 生产环境
   NODE_ENV=production bun run dev
   # 或者构建后运行
   bun run build
   bun run start
   ```

### 4.2 错误处理策略

1. **服务初始化检查**：所有数据库服务必须在初始化时检查配置的完整性
2. **优雅降级策略**：当高级功能不可用时，应自动回退到基础功能
3. **详细日志**：记录当前使用的数据库环境和初始化状态
4. **错误恢复机制**：提供自动重试和手动恢复选项

## 5. 新增表流程

当需要新增一个表时，需要在几个地方进行更新，但我们的架构设计使这个过程相对简单和一致。

### 5.1 创建新的表结构定义

首先，在 `schema/definitions/` 目录下创建一个新的表结构定义文件：

```typescript
// src/core/lib/db/schema/definitions/notification-schema.ts
import { schemaRegistry, TableSchema } from '../registry';

// 通知表结构定义
const notificationSchema: TableSchema = {
  name: 'notifications',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'userId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'type',
      type: 'string',
      notNull: true
    },
    {
      name: 'content',
      type: 'text',
      notNull: true
    },
    {
      name: 'isRead',
      type: 'boolean',
      notNull: true,
      defaultValue: false
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
  ],
  indexes: [
    {
      name: 'idx_notifications_user',
      columns: ['userId']
    },
    {
      name: 'idx_notifications_type',
      columns: ['type']
    },
    {
      name: 'idx_notifications_created_at',
      columns: ['createdAt']
    }
  ]
};

// 注册表结构
schemaRegistry.register(notificationSchema);

export default notificationSchema;
```

### 5.2 更新 drizzle-schema.ts 文件

接下来，更新 `drizzle-schema.ts` 文件，导入并导出新表的结构：

```typescript
// src/core/lib/db/schema/drizzle-schema.ts
import { DrizzleSchemaAdapter } from './adapters/drizzle-adapter';
import { schemaRegistry } from './registry';

// 导入所有表结构定义
import './definitions/user-schema';
import './definitions/match-schema';
import './definitions/message-schema';
import './definitions/notification-schema'; // 导入新表结构

// 获取所有表结构
const schemas = schemaRegistry.getAllSchemas();

// 转换为 Drizzle 表结构
export const users = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('users')!
);

export const matches = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('matches')!
);

export const messages = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('messages')!
);

export const notifications = DrizzleSchemaAdapter.convertToSqliteTable(
  schemaRegistry.getSchema('notifications')!
);

// 导出所有表结构
export const drizzleSchema = {
  users,
  matches,
  messages,
  notifications // 添加新表
};

// 生成迁移 SQL
export const migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);
```

### 5.3 创建数据模型

创建一个新的数据模型类：

```typescript
// src/core/lib/db/models/notification.ts
export interface Notification {
  id: string;
  userId: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.4 创建仓储类

为新表创建一个仓储类：

```typescript
// src/core/lib/db/repositories/notification-repository.ts
import { BaseRepository } from './base-repository';
import { Notification } from '../models/notification';
import { IBaseDatabaseClient } from '../interfaces';

/**
 * 通知仓储类
 * 处理通知相关的数据访问
 */
export class NotificationRepository extends BaseRepository<Notification> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'notifications');
  }
  
  /**
   * 查找用户的所有通知
   * @param userId 用户ID
   * @returns 通知列表
   */
  async findByUserId(userId: string): Promise<Notification[]> {
    return this.query({
      where: { userId },
      orderBy: '-createdAt'
    });
  }
  
  /**
   * 查找用户的未读通知
   * @param userId 用户ID
   * @returns 未读通知列表
   */
  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.query({
      where: { userId, isRead: false },
      orderBy: '-createdAt'
    });
  }
  
  /**
   * 标记通知为已读
   * @param id 通知ID
   */
  async markAsRead(id: string): Promise<void> {
    await this.update(id, {
      isRead: true
    } as Partial<Notification>);
  }
}
```

### 5.5 更新 DatabaseService 类

最后，更新 DatabaseService 类，添加新的仓储和相关方法：

```typescript
// src/core/lib/db/service.ts
// ... 现有代码 ...
import { NotificationRepository } from './repositories/notification-repository';
import { Notification } from './models/notification';

export class DatabaseService {
  // ... 现有代码 ...
  private notificationRepository: NotificationRepository;
  
  private constructor() {
    // ... 现有代码 ...
    this.notificationRepository = new NotificationRepository(this.client);
  }
  
  // ... 现有代码 ...
  
  getNotificationRepository(): NotificationRepository {
    this.checkInitialized();
    return this.notificationRepository;
  }
  
  // 通知相关操作
  async saveNotification(notification: Notification): Promise<void> {
    this.checkInitialized();
    if (notification.id) {
      await this.notificationRepository.update(notification.id, notification);
    } else {
      await this.notificationRepository.create(notification);
    }
  }
  
  async getNotification(id: string): Promise<Notification | null> {
    this.checkInitialized();
    return await this.notificationRepository.findById(id);
  }
  
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    this.checkInitialized();
    return await this.notificationRepository.findByUserId(userId);
  }
  
  // ... 现有代码 ...
}
```

## 6. 组件与页面数据访问模式

在应用开发中，组件和页面必须通过统一的数据服务接口访问数据，而不是直接导入模型或mock数据。这种模式有以下优势：

1. **环境适应性**：根据环境变量自动切换数据源（mock、local、production）
2. **关注点分离**：UI组件专注于展示逻辑，数据访问逻辑封装在服务中
3. **可测试性**：便于模拟数据服务进行单元测试
4. **一致性**：确保所有组件使用相同的数据访问方式
5. **可维护性**：当数据访问逻辑变更时，只需修改服务实现，而不影响UI组件

### 6.1 错误示例

以下是不推荐的数据访问方式：

```typescript
// 错误示例：直接导入mock数据
import { getRecommendedUsers } from '@/core/models/mock-data';

function DiscoverPage()