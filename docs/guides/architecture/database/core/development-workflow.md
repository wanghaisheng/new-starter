# Database Development Workflow

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
    └── user.ts           # 业务实体类型
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

## 3. 开发阶段

### 3.1 Mock数据阶段

#### 目的
- 快速开发和测试UI组件
- 验证业务逻辑
- 不依赖实际数据库环境
- 支持单元测试和集成测试

#### 实现方式
1. 使用`MockDatabaseClient`类，它提供两种工作模式：
   - **内存模式（Memory Mode）**：数据存储在内存中，应用重启后数据丢失，适用于单元测试
   - **JSON文件模式（JSON Mode）**：数据存储在JSON文件中，应用重启后数据保留，适用于集成测试和开发

2. 可通过配置选择适当的模式：
   ```typescript
   // 内存模式配置（默认）
   const db = new MockDatabaseClient({
     name: 'test-db',
     version: 1,
     mockMode: 'memory'
   });
   
   // JSON文件模式配置
   const db = new MockDatabaseClient({
     name: 'test-db',
     version: 1,
     mockMode: 'json',
     jsonFilePath: './data/test-db.json',
     autoSave: true // 启用自动保存
   });
   ```

3. 在`.env.development`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=mock
   NEXT_PUBLIC_MOCK_DB_TYPE=memory  # 或 json
   NEXT_PUBLIC_MOCK_JSON_PATH=./data/mock-data.json  # JSON文件路径（当使用json模式时）
   NEXT_PUBLIC_MOCK_AUTO_SAVE=false  # 是否自动保存更改到JSON文件
   ```

#### 特性
- **自动日期转换**：JSON文件模式会自动将日期字符串转换为Date对象
- **事务支持**：JSON模式下通过文件重新加载实现事务回滚
- **批量操作**：支持多个操作合并为一个事务
- **数据持久化**：支持将数据保存到JSON文件和从JSON文件加载
- **统一错误处理**：使用`DatabaseError`类封装所有错误，提供标准错误代码
- **统一日志记录**：使用`DatabaseLogger`记录所有数据库操作和错误

#### 验收标准
- [ ] Mock数据服务接口完整
- [ ] 数据结构符合设计规范
- [ ] 测试用例覆盖主要场景
- [ ] 内存和JSON文件模式正常工作
- [ ] 事务和批量操作正确实现
- [ ] 错误处理和日志记录符合标准

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

### 4.3 统一错误处理

为了确保数据库操作中的错误能够被一致地处理和报告，项目实现了统一的错误处理机制：

1. **标准化错误类型**：使用`DatabaseError`类表示数据库操作中的所有错误
   ```typescript
   export class DatabaseError extends Error {
     constructor(
       message: string, 
       public code: DatabaseErrorCode | string,
       public details?: any
     ) {
       super(message);
       this.name = 'DatabaseError';
       
       // 确保正确的原型链
       Object.setPrototypeOf(this, DatabaseError.prototype);
     }
     
     getFormattedMessage(): string {
       return `[${this.code}] ${this.message}`;
     }
   }
   ```

2. **标准化错误代码**：定义一组标准的错误代码，用于分类数据库错误
   ```typescript
   export enum DatabaseErrorCode {
     // 一般错误
     UNKNOWN_ERROR = 'UNKNOWN_ERROR',
     INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
     CONNECTION_ERROR = 'CONNECTION_ERROR',
     
     // 数据访问错误
     NOT_FOUND = 'NOT_FOUND',
     ALREADY_EXISTS = 'ALREADY_EXISTS',
     INVALID_DATA = 'INVALID_DATA',
     
     // 事务错误
     TRANSACTION_ERROR = 'TRANSACTION_ERROR',
     NO_ACTIVE_TRANSACTION = 'NO_ACTIVE_TRANSACTION',
     
     // 客户端状态错误
     CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
     // ... 更多错误代码
   }
   ```

3. **统一的错误处理模式**：在所有数据库操作中采用一致的错误处理模式
   ```typescript
   try {
     // 数据库操作
     await client.create(tableName, data);
   } catch (error) {
     // 转换为标准错误
     if (error instanceof DatabaseError) {
       throw error;
     } else {
       throw new DatabaseError(
         `创建实体失败: ${error.message}`,
         DatabaseErrorCode.OPERATION_FAILED,
         { tableName, data, originalError: error }
       );
     }
   }
   ```

### 4.4 统一日志系统

项目实现了专门的数据库日志记录系统，确保所有数据库操作都能被一致地记录：

1. **日志级别**：支持多种日志级别，可根据环境调整详细程度
   ```typescript
   export enum LogLevel {
     DEBUG = 0,
     INFO = 1,
     WARN = 2,
     ERROR = 3,
     NONE = 4
   }
   ```

2. **日志记录器类**：提供统一的日志记录接口
   ```typescript
   export class DatabaseLogger {
     constructor(
       private moduleName: string,
       private config: LoggerConfig = {}
     ) { /* ... */ }
     
     debug(message: string, data?: any): void { /* ... */ }
     info(message: string, data?: any): void { /* ... */ }
     warn(message: string, data?: any): void { /* ... */ }
     error(message: string, error?: any): void { /* ... */ }
   }
   ```

3. **子日志记录器**：支持创建子模块专用的日志记录器
   ```typescript
   // 创建主日志记录器
   const dbLogger = new DatabaseLogger('DB');
   
   // 为特定模块创建子日志记录器
   const userRepoLogger = dbLogger.createSubLogger('UserRepository');
   const sqliteLogger = dbLogger.createSubLogger('SQLiteClient');
   ```

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
    
    await Promise.all(entities.map(entity => client.create(tableName, entity)));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 验证性能指标
    expect(duration).toBeLessThan(5000); // 应在5秒内完成
    
    // 验证数据完整性
    const savedEntities = await client.findAll(tableName);
    expect(savedEntities.length).toBe(1000);
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