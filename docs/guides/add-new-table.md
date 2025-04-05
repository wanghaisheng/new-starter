# 关于新增表的处理

当你需要新增一个表时，确实需要在几个地方进行更新，但我们的架构设计使这个过程相对简单和一致。

对于 IndexedDB 客户端中硬编码的部分，主要是在数据库初始化和事务处理时需要明确指定表名。这是因为 IndexedDB 的 API 要求我们在打开数据库连接和创建事务时显式指定要操作的表。

下面是新增表的完整步骤：

## 1. 创建新的表结构定义

首先，在 `schema/definitions/` 目录下创建一个新的表结构定义文件：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\schema\definitions\notification-schema.ts
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
schemaRegistry.registerSchema(notificationSchema);

export default notificationSchema;
```

## 2. 更新 drizzle-schema.ts 文件

接下来，更新 `drizzle-schema.ts` 文件，导入并导出新表的结构：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\schema\drizzle-schema.ts
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

## 3. 创建数据模型

创建一个新的数据模型类：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\models\notification.ts
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

## 4. 创建仓储类

为新表创建一个仓储类：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\repositories\notification-repository.ts
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
  
  /**
   * 标记用户的所有通知为已读
   * @param userId 用户ID
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findUnreadByUserId(userId);
    
    for (const notification of notifications) {
      await this.markAsRead(notification.id);
    }
  }
}
```

## 5. 更新 IndexedDB 客户端

对于 IndexedDB 客户端，需要更新以下几个部分：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\clients\indexeddb\indexeddb-client.ts
// ... 现有代码 ...

private data: {
  users: Map<string, User>;
  matches: Map<string, Match>;
  messages: Map<string, Message>;
  notifications: Map<string, Notification>; // 添加新表
} = {
  users: new Map(),
  matches: new Map(),
  messages: new Map(),
  notifications: new Map(), // 添加新表
};

// ... 现有代码 ...

async clear(): Promise<void> {
  this.checkInitialized();
  
  const transaction = this.db!.transaction(['users', 'matches', 'messages', 'notifications'], 'readwrite'); // 添加新表
  
  transaction.objectStore('users').clear();
  transaction.objectStore('matches').clear();
  transaction.objectStore('messages').clear();
  transaction.objectStore('notifications').clear(); // 添加新表
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ... 现有代码 ...

async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
  this.checkInitialized();
  
  // 创建一个包含所有表的事务
  const transaction = this.db!.transaction(['users', 'matches', 'messages', 'notifications'], 'readwrite'); // 添加新表
  
  // ... 现有代码 ...
}

// ... 现有代码 ...

private setupDatabase(db: IDBDatabase, oldVersion: number): void {
  // 创建表和索引
  if (oldVersion < 1) {
    // ... 现有代码 ...
    
    // 通知表
    if (!db.objectStoreNames.contains('notifications')) {
      const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
      notificationsStore.createIndex('userId', 'userId', { unique: false });
      notificationsStore.createIndex('type', 'type', { unique: false });
      notificationsStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
  }
}

// ... 现有代码 ...

private getTable(tableName: string): Map<string, any> {
  switch (tableName) {
    case 'users':
      return this.data.users;
    case 'matches':
      return this.data.matches;
    case 'messages':
      return this.data.messages;
    case 'notifications': // 添加新表
      return this.data.notifications;
    default:
      throw new Error(`表不存在: ${tableName}`);
  }
}

// ... 现有代码 ...
```

## 6. 更新 DatabaseService 类

最后，更新 DatabaseService 类，添加新的仓储和相关方法：

```typescript:d:\Download\audio-visual\heytcm\new-starter\src\core\lib\db\service.ts
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
  
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    this.checkInitialized();
    return await this.notificationRepository.findUnreadByUserId(userId);
  }
  
  async markNotificationAsRead(id: string): Promise<void> {
    this.checkInitialized();
    await this.notificationRepository.markAsRead(id);
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.checkInitialized();
    await this.notificationRepository.markAllAsRead(userId);
  }
  
  async deleteNotification(id: string): Promise<void> {
    this.checkInitialized();
    await this.notificationRepository.delete(id);
  }
  
  // ... 现有代码 ...
}
```

通过以上步骤，你可以完整地添加一个新表，并确保所有相关组件都能正确处理这个新表。虽然确实需要在几个地方进行更新，但这些更新都是遵循一致的模式，使得整个过程相对简单和可预测。

# 添加新数据表指南

本文档详细说明了如何在项目中添加新的数据表，包括模式定义、仓储实现和服务层整合。

## 1. 概述

添加新表的完整流程包括以下步骤：

1. 定义表结构和类型
2. 创建表模式（Schema）
3. 实现仓储类（Repository）
4. 注册表到模式注册表（SchemaRegistry）
5. 扩展数据服务接口
6. 编写测试

## 2. 表结构和类型定义

### 2.1 在 types 目录中定义类型

首先，在 `src/core/lib/db/types` 目录中定义新实体的类型接口：

```typescript
// src/core/lib/db/types/report.ts
import { BaseEntity } from './base-entity';

// 定义举报状态类型
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'rejected';

// 定义举报解决方案类型
export type ReportResolution = 'warning' | 'suspension' | 'ban' | 'noAction';

// 定义举报实体接口
export interface Report extends BaseEntity {
  reporterId: string;         // 举报者ID
  targetUserId: string;       // 被举报用户ID
  reason: string;             // 举报原因
  description: string;        // 详细描述
  evidenceUrls?: string[];    // 证据URL数组
  status: ReportStatus;       // 举报状态
  resolution?: ReportResolution; // 解决方案
  adminNotes?: string;        // 管理员备注
}
```

### 2.2 定义创建时所需数据类型

对于创建新记录时所需的数据，定义专门的类型：

```typescript
// src/core/lib/db/types/report.ts（续）

// 定义创建举报所需的数据
export interface CreateReportData {
  reporterId: string;
  targetUserId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}
```

## 3. 表模式定义

在 `src/core/lib/db/schema/definitions` 目录中创建表模式定义文件：

```typescript
// src/core/lib/db/schema/definitions/report-schema.ts
import { TableSchema } from '@/core/lib/db/schema/types';

// 定义举报表模式
export const reportSchema: TableSchema = {
  name: 'reports',
  syncConfig: {
    // 同步配置，决定数据如何在客户端和服务器之间同步
    offlineEnabled: true,      // 是否支持离线访问
    syncDirection: 'both',     // 同步方向：'up'（上传）, 'down'（下载）, 'both'（双向）
    syncPriority: 'low'        // 同步优先级：'high', 'medium', 'low'
  },
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'reporterId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'targetUserId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'reason',
      type: 'string',
      notNull: true
    },
    {
      name: 'description',
      type: 'text',
      notNull: true
    },
    {
      name: 'evidenceUrls',
      type: 'json',
      defaultValue: '[]'
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'pending'
    },
    {
      name: 'resolution',
      type: 'string'
    },
    {
      name: 'adminNotes',
      type: 'text'
    },
    {
      name: 'createdAt',
      type: 'date',
      notNull: true,
      defaultValue: 'CURRENT_TIMESTAMP'
    },
    {
      name: 'updatedAt',
      type: 'date',
      notNull: true,
      defaultValue: 'CURRENT_TIMESTAMP'
    }
  ],
  indexes: [
    {
      name: 'idx_reports_reporterId',
      columns: ['reporterId']
    },
    {
      name: 'idx_reports_targetUserId',
      columns: ['targetUserId']
    },
    {
      name: 'idx_reports_status',
      columns: ['status']
    }
  ]
};
```

## 4. 实现仓储类

在 `src/core/lib/db/repositories` 目录中创建仓储类：

```typescript
// src/core/lib/db/repositories/report-repository.ts
import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { Report } from '@/core/lib/db/types';

import { BaseRepository } from './base-repository';

/**
 * 举报仓储类
 * 处理用户举报相关的数据访问
 */
export class ReportRepository extends BaseRepository<Report> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'reports');
  }

  /**
   * 根据举报者ID查找举报
   * @param reporterId 举报者ID
   * @returns 举报列表
   */
  async findByReporterId(reporterId: string): Promise<Report[]> {
    const result = await this.query({
      where: { reporterId }
    });
    return result.data; // 注意：必须返回 result.data，而不是直接返回 result
  }

  /**
   * 根据被举报用户ID查找举报
   * @param targetUserId 被举报用户ID
   * @returns 举报列表
   */
  async findByTargetUserId(targetUserId: string): Promise<Report[]> {
    const result = await this.query({
      where: { targetUserId }
    });
    return result.data; // 注意：必须返回 result.data，而不是直接返回 result
  }

  /**
   * 根据状态查找举报
   * @param status 举报状态
   * @returns 举报列表
   */
  async findByStatus(status: Report['status']): Promise<Report[]> {
    const result = await this.query({
      where: { status }
    });
    return result.data; // 注意：必须返回 result.data，而不是直接返回 result
  }

  /**
   * 更新举报状态
   * @param id 举报ID
   * @param status 新状态
   * @param resolution 解决方案（可选）
   * @returns 更新后的举报
   */
  async updateStatus(id: string, status: Report['status'], resolution?: Report['resolution']): Promise<Report> {
    const updateData: Partial<Report> = { status };
    if (resolution) {
      updateData.resolution = resolution;
    }
    
    await this.update(id, updateData);
    const report = await this.findById(id);
    if (!report) throw new Error(`Report not found: ${id}`);
    return report;
  }
}
```

## 5. 注册表模式

在 `src/core/lib/db/schema/index.ts` 文件中注册新表模式：

```typescript
// src/core/lib/db/schema/index.ts
import { SchemaRegistry } from './schema-registry';
import { userSchema } from './definitions/user-schema';
import { matchSchema } from './definitions/match-schema';
import { messageSchema } from './definitions/message-schema';
import { reportSchema } from './definitions/report-schema'; // 导入新表模式

// 获取模式注册表实例
const schemaRegistry = SchemaRegistry.getInstance();

// 注册所有表模式
schemaRegistry.register(userSchema);
schemaRegistry.register(matchSchema);
schemaRegistry.register(messageSchema);
schemaRegistry.register(reportSchema); // 注册新表模式

export { schemaRegistry };
```

## 6. 扩展数据库服务

在 `src/core/lib/db/service.ts` 中添加新仓储类的支持：

```typescript
// src/core/lib/db/service.ts
import { ReportRepository } from './repositories/report-repository';

export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private isInitialized = false;
  
  // 添加新仓储实例属性
  private userRepository: UserRepository | null = null;
  private matchRepository: MatchRepository | null = null;
  private messageRepository: MessageRepository | null = null;
  private reportRepository: ReportRepository | null = null; // 新增
  
  // ...其他代码...
  
  // 添加获取仓储的方法
  getReportRepository(): ReportRepository {
    this.checkInitialized();
    if (!this.reportRepository) {
      this.reportRepository = new ReportRepository(this.client);
    }
    return this.reportRepository;
  }
  
  // ...其他代码...
}
```

## 7. 创建服务层方法

在服务层中创建对应的方法以访问新表：

```typescript
// src/core/services/report-service.ts
import { Report, CreateReportData } from '@/core/lib/db/types';
import { DatabaseService } from '@/core/lib/db/service';

export class ReportService {
  private static instance: ReportService;
  private dbService: DatabaseService;
  
  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }
  
  public static getInstance(): ReportService {
    if (!this.instance) {
      this.instance = new ReportService();
    }
    return this.instance;
  }
  
  async submitReport(data: CreateReportData): Promise<Report> {
    const repository = this.dbService.getReportRepository();
    return repository.create(data);
  }
  
  async getReportsByUser(userId: string): Promise<Report[]> {
    const repository = this.dbService.getReportRepository();
    return repository.findByReporterId(userId);
  }
  
  async getReportsAgainstUser(userId: string): Promise<Report[]> {
    const repository = this.dbService.getReportRepository();
    return repository.findByTargetUserId(userId);
  }
  
  // ... 其他服务方法 ...
}
```

## 8. 重要提示：处理 QueryResult 类型

在实现仓储方法时，必须特别注意 `query` 方法返回的是 `QueryResult<T>` 类型，它包含以下属性：

```typescript
interface QueryResult<T> {
  data: T[];        // 实际数据数组
  total: number;    // 总记录数
  hasMore: boolean; // 是否有更多记录
}
```

### 8.1 常见错误与解决方案

#### 错误 1：直接返回 query 结果

```typescript
// 错误 - 类型不匹配
async findByReporterId(reporterId: string): Promise<Report[]> {
  return await this.query({  // 返回 QueryResult<Report>，而非 Report[]
    where: { reporterId }
  });
}
```

#### 正确做法：提取 data 属性

```typescript
// 正确 - 返回类型匹配
async findByReporterId(reporterId: string): Promise<Report[]> {
  const result = await this.query({
    where: { reporterId }
  });
  return result.data;  // 提取 data 属性返回 Report[]
}
```

#### 错误 2：检查结果长度

```typescript
// 错误 - 直接检查结果的长度
async checkIfReported(reporterId: string, targetUserId: string): Promise<boolean> {
  const reports = await this.query({
    where: { reporterId, targetUserId }
  });
  return reports.length > 0;  // 错误：QueryResult 没有 length 属性
}
```

#### 正确做法：检查 data 数组长度

```typescript
// 正确 - 检查 data 数组的长度
async checkIfReported(reporterId: string, targetUserId: string): Promise<boolean> {
  const result = await this.query({
    where: { reporterId, targetUserId }
  });
  return result.data.length > 0;  // 正确：使用 data.length
}
```

#### 错误 3：访问第一个元素

```typescript
// 错误 - 直接索引访问结果
async findFirstReport(userId: string): Promise<Report | null> {
  const reports = await this.query({
    where: { reporterId: userId },
    limit: 1
  });
  return reports[0] || null;  // 错误：QueryResult 不是数组
}
```

#### 正确做法：访问 data 数组的第一个元素

```typescript
// 正确 - 索引访问 data 数组
async findFirstReport(userId: string): Promise<Report | null> {
  const result = await this.query({
    where: { reporterId: userId },
    limit: 1
  });
  return result.data.length > 0 ? result.data[0] : null;  // 正确
}
```

## 9. 测试新表功能

为新表创建单元测试，确保其功能正常：

```typescript
// src/test/repositories/report-repository.test.ts
import { ReportRepository } from '@/core/lib/db/repositories/report-repository';
import { MockDatabaseClient } from '@/core/lib/db/clients/mock';
import { Report } from '@/core/lib/db/types';

describe('ReportRepository', () => {
  let client: MockDatabaseClient;
  let repository: ReportRepository;
  
  beforeEach(() => {
    client = new MockDatabaseClient({
      name: 'test-db',
      version: 1,
      engine: 'mock'
    });
    repository = new ReportRepository(client);
  });
  
  it('should find reports by reporterId', async () => {
    // 测试代码
  });
  
  // 更多测试...
});
```

## 10. 更新索引文件

确保在相应的索引文件中导出新增的类型和类：

```typescript
// src/core/lib/db/repositories/index.ts
export * from './report-repository';

// src/core/lib/db/types/index.ts
export * from './report';
```

## 总结

添加新表是一个完整的过程，需要从类型定义到仓储实现，再到服务层集成。特别注意处理 `query` 方法返回的 `QueryResult<T>` 类型，确保在使用查询结果时正确提取 `data` 属性以避免类型不匹配错误。