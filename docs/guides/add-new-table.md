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