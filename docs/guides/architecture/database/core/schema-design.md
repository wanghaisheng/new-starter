# 数据库模式设计指南

## 概述

本文档详细说明了项目中数据库模式的设计原则、表结构定义和关系模型，旨在帮助开发人员理解和正确使用数据库模式。结合数据库重构计划，本指南提供了创建和维护一致性数据模型的最佳实践。

## 1. 设计原则

### 1.1 统一模式定义

所有数据库表结构应在 `SchemaRegistry` 中集中定义和管理，确保不同数据库客户端实现使用相同的表结构。

```typescript
// 在 schema/registry.ts 中定义表结构注册中心
export class SchemaRegistry {
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

  public registerSchema(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
  }

  public getSchema(name: string): TableSchema | undefined {
    return this.schemas.get(name);
  }

  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }
}
```

### 1.2 表结构定义规范

每个表结构定义应包含以下内容：

- 表名（全小写，复数形式）
- 列定义（包括名称、类型、约束等）
- 索引定义（提高查询性能）
- 外键关系（维护数据完整性）

```typescript
// 表结构定义示例
const userSchema: TableSchema = {
  name: 'users',  // 表名使用小写复数形式
  columns: [
    {
      name: 'id',  // 主键
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'email',  // 唯一约束
      type: 'string',
      unique: true
    },
    {
      name: 'createdAt',  // 创建时间
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    }
    // 其他列...
  ],
  indexes: [
    {
      name: 'idx_users_email',  // 索引命名规范：idx_表名_字段名
      columns: ['email'],
      unique: true
    }
  ]
};
```

### 1.3 命名规范

- **表名**：使用小写复数形式（例如：`users`, `matches`, `messages`）
- **列名**：使用驼峰命名法（例如：`firstName`, `createdAt`, `isActive`）
- **主键**：通常命名为 `id`
- **外键**：使用关联表名的单数形式加上 `Id`（例如：`userId`, `matchId`）
- **索引**：使用 `idx_表名_字段名` 格式（例如：`idx_users_email`）
- **唯一约束**：使用 `uq_表名_字段名` 格式（例如：`uq_users_email`）

## 2. 核心表结构

### 2.1 用户表（users）

存储用户基本信息。

```typescript
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
    {
      name: 'email',
      type: 'string',
      unique: true
    },
    {
      name: 'phone',
      type: 'string'
    },
    {
      name: 'googleId',
      type: 'string'
    },
    {
      name: 'birthDate',
      type: 'date',
      notNull: true
    },
    {
      name: 'gender',
      type: 'string',
      notNull: true
    },
    {
      name: 'bio',
      type: 'text'
    },
    {
      name: 'interests',
      type: 'json',  // 存储为JSON数组
      notNull: true,
      defaultValue: '[]'
    },
    {
      name: 'isVerified',
      type: 'boolean',
      notNull: true,
      defaultValue: false
    },
    {
      name: 'lastActive',
      type: 'date',
      notNull: true,
      defaultValue: () => new Date()
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'active'
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
      name: 'idx_users_email',
      columns: ['email'],
      unique: true
    },
    {
      name: 'idx_users_googleId',
      columns: ['googleId']
    },
    {
      name: 'idx_users_lastActive',
      columns: ['lastActive']
    }
  ]
};
```

### 2.2 照片表（photos）

存储用户照片信息。

```typescript
const photoSchema: TableSchema = {
  name: 'photos',
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
      name: 'url',
      type: 'string',
      notNull: true
    },
    {
      name: 'order',
      type: 'integer',
      notNull: true,
      defaultValue: 0
    },
    {
      name: 'isMain',
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
      name: 'idx_photos_userId',
      columns: ['userId']
    },
    {
      name: 'idx_photos_userId_order',
      columns: ['userId', 'order']
    }
  ]
};
```

### 2.3 位置表（locations）

存储用户位置信息。

```typescript
const locationSchema: TableSchema = {
  name: 'locations',
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
      name: 'latitude',
      type: 'real',
      notNull: true
    },
    {
      name: 'longitude',
      type: 'real',
      notNull: true
    },
    {
      name: 'city',
      type: 'string',
      notNull: true
    },
    {
      name: 'country',
      type: 'string',
      notNull: true
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
      name: 'idx_locations_userId',
      columns: ['userId'],
      unique: true
    },
    {
      name: 'idx_locations_coordinates',
      columns: ['latitude', 'longitude']
    }
  ]
};
```

### 2.4 用户偏好表（user_preferences）

存储用户匹配偏好设置。

```typescript
const userPreferenceSchema: TableSchema = {
  name: 'user_preferences',
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
      name: 'ageRangeMin',
      type: 'integer',
      notNull: true,
      defaultValue: 18
    },
    {
      name: 'ageRangeMax',
      type: 'integer',
      notNull: true,
      defaultValue: 99
    },
    {
      name: 'distance',
      type: 'integer',
      notNull: true,
      defaultValue: 50
    },
    {
      name: 'genderPreferences',
      type: 'json',  // 存储为JSON数组
      notNull: true,
      defaultValue: '["male","female"]'
    },
    {
      name: 'interests',
      type: 'json',  // 存储为JSON数组
      notNull: true,
      defaultValue: '[]'
    },
    {
      name: 'dealBreakers',
      type: 'json',  // 存储为JSON数组
      defaultValue: '[]'
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
      name: 'idx_user_preferences_userId',
      columns: ['userId'],
      unique: true
    }
  ]
};
```

### 2.5 匹配表（matches）

存储用户之间的匹配关系。

```typescript
const matchSchema: TableSchema = {
  name: 'matches',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'user1Id',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'user2Id',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'pending'
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
      name: 'idx_matches_users',
      columns: ['user1Id', 'user2Id'],
      unique: true
    },
    {
      name: 'idx_matches_user1Id',
      columns: ['user1Id']
    },
    {
      name: 'idx_matches_user2Id',
      columns: ['user2Id']
    },
    {
      name: 'idx_matches_status',
      columns: ['status']
    }
  ]
};
```

### 2.6 匹配操作表（match_actions）

存储用户的匹配操作（喜欢、不喜欢等）。

```typescript
const matchActionSchema: TableSchema = {
  name: 'match_actions',
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
      name: 'targetUserId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'action',
      type: 'string',
      notNull: true
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
      name: 'idx_match_actions_user_target',
      columns: ['userId', 'targetUserId'],
      unique: true
    },
    {
      name: 'idx_match_actions_userId',
      columns: ['userId']
    },
    {
      name: 'idx_match_actions_targetUserId',
      columns: ['targetUserId']
    }
  ]
};
```

### 2.7 消息表（messages）

存储用户之间的消息。

```typescript
const messageSchema: TableSchema = {
  name: 'messages',
  columns: [
    {
      name: 'id',
      type: 'string',
      primaryKey: true,
      notNull: true
    },
    {
      name: 'matchId',
      type: 'string',
      notNull: true,
      references: {
        table: 'matches',
        column: 'id'
      }
    },
    {
      name: 'senderId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'content',
      type: 'text',
      notNull: true
    },
    {
      name: 'type',
      type: 'string',
      notNull: true,
      defaultValue: 'text'
    },
    {
      name: 'status',
      type: 'string',
      notNull: true,
      defaultValue: 'sent'
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
      name: 'idx_messages_matchId',
      columns: ['matchId']
    },
    {
      name: 'idx_messages_senderId',
      columns: ['senderId']
    },
    {
      name: 'idx_messages_matchId_createdAt',
      columns: ['matchId', 'createdAt']
    }
  ]
};
```

## 3. 关系模型

### 3.1 实体关系图

以下是主要实体之间的关系：

```
User 1--* Photo (一个用户有多张照片)
User 1--1 Location (一个用户有一个位置)
User 1--1 UserPreference (一个用户有一组偏好设置)
User 1--* MatchAction (一个用户有多个匹配操作)
User *--* User (通过 Match 表实现多对多关系)
Match 1--* Message (一个匹配有多条消息)
```

### 3.2 关系约束

- **级联删除**：当删除用户时，应级联删除其照片、位置、偏好设置和匹配操作
- **引用完整性**：外键关系确保引用的实体存在
- **唯一约束**：确保某些组合是唯一的，如用户对之间的匹配

## 4. 数据类型映射

不同数据库引擎的类型映射：

| 通用类型 | SQLite | IndexedDB | Cloudflare D1 | Firebase |
|---------|--------|-----------|--------------|----------|
| string  | TEXT   | string    | TEXT         | string   |
| integer | INTEGER| number    | INTEGER      | number   |
| real    | REAL   | number    | REAL         | number   |
| boolean | INTEGER| boolean   | INTEGER      | boolean  |
| date    | TEXT   | Date      | TEXT         | timestamp|
| text    | TEXT   | string    | TEXT         | string   |
| json    | TEXT   | object    | TEXT         | object   |

## 5. 索引策略

### 5.1 何时创建索引

- 频繁查询的列
- 外键列
- 排序和分组操作的列
- 唯一约束列

### 5.2 索引类型

- **单列索引**：针对单个列的索引
- **复合索引**：针对多个列的组合索引
- **唯一索引**：确保索引列的值唯一

### 5.3 索引注意事项

- 索引会增加写入操作的开销
- 过多的索引会占用存储空间
- 应根据实际查询模式优化索引

## 6. JSON 数据处理

某些字段（如兴趣、性别偏好等）使用 JSON 类型存储数组或对象。不同数据库引擎处理 JSON 数据的方式不同：

### 6.1 SQLite

```typescript
// 存储 JSON 数据
await client.executeRawQuery(
  'INSERT INTO users (id, name, interests) VALUES (?, ?, ?)',
  ['user-1', 'John', JSON.stringify(['sports', 'music'])]
);

// 查询 JSON 数据
const users = await client.executeRawQuery(
  'SELECT * FROM users WHERE json_extract(interests, "$[0]") = ?',
  ['sports']
);
```

### 6.2 IndexedDB

```typescript
// 存储 JSON 数据（自动处理）
await client.create('users', {
  id: 'user-1',
  name: 'John',
  interests: ['sports', 'music']
});

// 查询 JSON 数据（需要在内存中过滤）
const allUsers = await client.findAll('users');
const sportsUsers = allUsers.filter(user => 
  user.interests && user.interests.includes('sports')
);
```

## 7. 模式版本管理

### 7.1 版本号管理

使用环境变量 `NEXT_PUBLIC_DB_VERSION` 管理数据库版本。每当模式发生变化时，应增加版本号。

```typescript
const dbVersion = parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10);
```

### 7.2 迁移策略

在数据库初始化时检查版本并执行必要的迁移：

```typescript
export class IndexedDBClient extends BaseClient {
  async initialize(): Promise<void> {
    // 打开数据库连接
    const openRequest = window.indexedDB.open(this.dbName, this.dbVersion);
    
    // 处理数据库升级事件
    openRequest.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const newVersion = this.dbVersion;
      
      // 执行迁移
      this.migrateDatabase(db, oldVersion, newVersion);
    };
    
    // 等待数据库打开
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });
    
    this.initialized = true;
  }
  
  private migrateDatabase(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    // 获取所有表结构
    const schemas = schemaRegistry.getAllSchemas();
    
    // 根据版本执行迁移
    if (oldVersion < 1) {
      // 初始版本，创建所有表
      for (const schema of schemas) {
        this.createStore(db, schema);
      }
    }
    
    if (oldVersion < 2) {
      // 版本2的迁移
      // 例如：添加新表或修改现有表
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationSchema = schemaRegistry.getSchema('notifications');
        if (notificationSchema) {
          this.createStore(db, notificationSchema);
        }
      }
    }
    
    // 添加更多版本的迁移...
  }
  
  private createStore(db: IDBDatabase, schema: TableSchema): void {
    // 创建对象存储
    const store = db.createObjectStore(schema.name, {
      keyPath: schema.columns.find(col => col.primaryKey)?.name || 'id'
    });
    
    // 创建索引
    for (const index of schema.indexes || []) {
      store.createIndex(index.name, index.columns, {
        unique: index.unique || false
      });
    }
  }
}
```

## 8. 最佳实践

### 8.1 模式定义

- 在单独的文件中定义每个表的模式
- 使用 SchemaRegistry 注册所有表结构
- 确保所有必要的索引都已定义

```typescript
// src/core/lib/db/schema/definitions/index.ts
import './user-schema';
import './photo-schema';
import './location-schema';
import './user-preference-schema';
import './match-schema';
import './match-action-schema';
import './message-schema';

// 确保所有表结构都已注册
export { schemaRegistry } from '../registry';
```

### 8.2 数据验证

在插入或更新数据前验证数据格式：

```typescript
export function validateUser(user: any): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof user.name === 'string' &&
    (user.email === undefined || typeof user.email === 'string') &&
    user.birthDate instanceof Date &&
    ['male', 'female', 'other'].includes(user.gender) &&
    Array.isArray(user.interests)
  );
}

// 使用验证函数
async create(data: any): Promise<User> {
  if (!validateUser(data)) {
    throw new Error('无效的用户数据');
  }
  
  return this.client.create<User>('users', data);
}
```

### 8.3 事务处理

对于涉及多个操作的场景，使用事务确保数据一致性：

```typescript
async createUserWithPreferences(user: User, preferences: UserPreferences): Promise<User> {
  return this.transaction(async (tx) => {
    // 创建用户
    const createdUser = await tx.create<User>('users', user);
    
    // 创建用户偏好
    await tx.create<UserPreferences>('user_preferences', {
      id: this.generateId(),
      userId: createdUser.id,
      ...preferences
    });
    
    return createdUser;
  });
}
```

### 8.4 查询优化

- 使用索引加速查询
- 限制返回的结果数量
- 只查询需要的字段

```typescript
// 使用索引加速查询
async findUsersByInterest(interest: string, limit: number = 10): Promise<User[]> {
  return this.query({
    where: {
      interests: { $contains: interest }
    },
    limit,
    orderBy: { field: 'lastActive', direction: 'desc' }
  });
}
```

## 9. 常见问题解答

### 9.1 如何处理复杂的JSON查询？

对于复杂的JSON查询，可以使用以下策略：

1. **SQLite**：使用JSON函数进行查询
   ```sql
   SELECT * FROM users WHERE json_extract(preferences, '$.gender') = 'female'
   ```

2. **IndexedDB**：在内存中过滤
   ```typescript
   const allUsers = await client.findAll('users');
   const femalePreference = allUsers.filter(user => 
     user.preferences && user.preferences.gender === 'female'
   );
   ```

3. **使用索引**：为常用的JSON属性创建虚拟列和索引
   ```typescript
   // 在表结构中添加虚拟列
   {
     name: 'preferredGender',
     type: 'string',
     generated: {
       expression: "json_extract(preferences, '$.gender')"
     }
   }
   ```

### 9.2 如何处理大量数据？

1. **分页查询**：限制每次查询的数据量
   ```typescript
   async findUsersPaginated(page: number, pageSize: number): Promise<User[]> {
     return this.query({
       orderBy: { field: 'createdAt', direction: 'desc' },
       limit: pageSize,
       offset: (page - 1) * pageSize