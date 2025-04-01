# 数据库开发常见问题与解决方案

## 概述

本文档总结了数据库开发过程中常见的问题和解决方案，旨在帮助开发团队避免重复踩坑，提高开发效率。文档基于项目实际开发经验，结合了数据库重构计划中发现的问题和解决思路。

## 1. 类型定义不一致问题

### 1.1 问题描述

在多个文件中定义了相同实体的不同类型接口，导致类型不一致，引发类型错误和运行时异常。

**常见症状：**

- TypeScript 编译时出现类型不匹配错误
- 运行时出现属性未定义或类型错误
- 代码提示不准确，影响开发效率

**错误示例：**

```typescript
// 在 types/dating.ts 中定义
export interface User {
  id: string;
  name: string;
  email?: string;
  // 其他属性...
}

// 在 models/user.ts 中又定义了一次
export interface UserModel {
  id: string;
  name: string;
  emailAddress?: string; // 注意这里属性名不一致
  // 其他属性...
}
```

### 1.2 解决方案

#### 1.2.1 集中定义类型

将所有实体类型定义集中在一个目录下，避免重复定义：

```typescript
// src/core/lib/db/types/dating.ts
import { BaseEntity } from './base-entity';

// 用户相关类型
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

// 其他类型定义...
```

#### 1.2.2 使用类型导入而非重新定义

在需要使用类型的地方，通过导入而非重新定义：

```typescript
// 正确示例
import { User } from '../types/dating';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // 实现...
  }
}
```

#### 1.2.3 使用类型扩展而非重新定义

如果需要扩展现有类型，使用类型扩展：

```typescript
// 正确示例
import { User } from '../types/dating';

// 扩展用户类型，添加额外属性
export interface UserWithStats extends User {
  matchCount: number;
  messageCount: number;
}
```

## 2. 接口实现不完整问题

### 2.1 问题描述

实现类没有完全实现接口定义的所有方法，或者实现与接口定义不一致，导致运行时错误。

**常见症状：**

- TypeScript 编译时出现接口实现不完整错误
- 运行时出现方法未定义错误
- 方法参数或返回值类型不匹配

**错误示例：**

```typescript
// 接口定义
export interface IDatabaseClient {
  initialize(): Promise<void>;
  findById(tableName: string, id: string): Promise<any>;
  // 其他方法...
}

// 不完整的实现
export class MockDatabaseClient implements IDatabaseClient {
  async initialize(): Promise<void> {
    // 实现...
  }
  
  // 缺少 findById 方法的实现
}
```

### 2.2 解决方案

#### 2.2.1 使用抽象基类

创建抽象基类实现接口的通用部分，具体实现类继承基类：

```typescript
// 抽象基类
export abstract class BaseClient implements IBaseDatabaseClient {
  protected initialized = false;
  
  // 生命周期方法
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  abstract clear(): Promise<void>;
  
  // 通用数据访问接口
  abstract findById(tableName: string, id: string): Promise<BaseEntity | null>;
  abstract findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]>;
  // 其他抽象方法...
  
  // 辅助方法实现
  protected checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('数据库客户端未初始化');
    }
  }
  
  // 其他辅助方法...
}

// 具体实现类
export class MockDatabaseClient extends BaseClient {
  // 实现所有抽象方法
  async initialize(): Promise<void> {
    // 实现...
    this.initialized = true;
  }
  
  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    this.checkInitialized();
    // 实现...
  }
  
  // 其他方法实现...
}
```

#### 2.2.2 使用接口检查工具

在单元测试中添加接口实现完整性检查：

```typescript
describe('MockDatabaseClient', () => {
  it('should implement all IDatabaseClient methods', () => {
    const client = new MockDatabaseClient();
    const interfaceMethods = Object.getOwnPropertyNames(IDatabaseClient.prototype);
    
    for (const method of interfaceMethods) {
      if (method !== 'constructor') {
        expect(typeof client[method]).toBe('function');
      }
    }
  });
});
```

#### 2.2.3 使用 TypeScript 严格模式

在 `tsconfig.json` 中启用严格模式，帮助捕获接口实现不完整的问题：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

## 3. 导入路径混乱问题

### 3.1 问题描述

项目中存在多种导入路径格式，导致代码难以维护，重构时容易出错。

**常见症状：**

- 同一模块在不同文件中使用不同的导入路径
- 存在过深的相对路径导入（如 `../../../../`）
- 模块移动后导入路径失效

**错误示例：**

```typescript
// 文件 A 中使用相对路径
import { User } from '../../../types/dating';

// 文件 B 中使用绝对路径
import { User } from '@/core/lib/db/types/dating';

// 文件 C 中使用不同的相对路径
import { User } from '../../db/types/dating';
```

### 3.2 解决方案

#### 3.2.1 使用一致的导入路径风格

选择一种导入路径风格并在整个项目中保持一致：

```typescript
// 推荐使用绝对路径导入
import { User } from '@/core/lib/db/types/dating';
import { BaseRepository } from '@/core/lib/db/repositories/base-repository';
```

#### 3.2.2 使用路径别名

在 `tsconfig.json` 中配置路径别名，简化导入路径：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@db/*": ["src/core/lib/db/*"],
      "@models/*": ["src/core/lib/db/models/*"],
      "@types/*": ["src/core/lib/db/types/*"]
    }
  }
}
```

然后在代码中使用：

```typescript
import { User } from '@types/dating';
import { BaseRepository } from '@db/repositories/base-repository';
```

#### 3.2.3 使用索引文件导出

在每个目录创建 `index.ts` 文件，统一导出该目录下的所有模块：

```typescript
// src/core/lib/db/types/index.ts
export * from './dating';
export * from './base-entity';
export * from './database.types';

// 使用时
import { User, Match, Message } from '@/core/lib/db/types';
```

## 4. 数据库表结构定义不一致问题

### 4.1 问题描述

不同数据库客户端实现中对同一表的结构定义不一致，导致数据不兼容或查询错误。

**常见症状：**

- 不同环境下表结构不一致
- 数据迁移或同步时出现字段不匹配错误
- 查询返回的数据结构不一致

**错误示例：**

```typescript
// IndexedDB 实现中的用户表
const createUserStore = (db: IDBDatabase) => {
  const store = db.createObjectStore('users', { keyPath: 'id' });
  store.createIndex('email', 'email', { unique: true });
  store.createIndex('name', 'name', { unique: false });
};

// SQLite 实现中的用户表
const createUserTable = async (db: SQLiteConnection) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,  // 注意这里多了一个字段
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
```

### 4.2 解决方案

#### 4.2.1 使用集中式表结构注册中心

创建表结构注册中心，统一管理所有表的结构定义：

```typescript
// src/core/lib/db/schema/registry.ts
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

export const schemaRegistry = SchemaRegistry.getInstance();
```

#### 4.2.2 为每个表创建单独的结构定义文件

```typescript
// src/core/lib/db/schema/definitions/user-schema.ts
import { schemaRegistry, TableSchema } from '../registry';

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
      name: 'idx_users_name',
      columns: ['name']
    }
  ]
};

// 注册表结构
schemaRegistry.registerSchema(userSchema);

export default userSchema;
```

#### 4.2.3 使用适配器转换表结构

为不同的数据库引擎创建适配器，将通用表结构转换为特定引擎的格式：

```typescript
// src/core/lib/db/schema/adapters/indexeddb-adapter.ts
import { TableSchema } from '../registry';

export class IndexedDBSchemaAdapter {
  /**
   * 将通用表结构转换为 IndexedDB 创建表的函数
   */
  static convertToStoreCreator(schema: TableSchema): (db: IDBDatabase) => void {
    return (db: IDBDatabase) => {
      const store = db.createObjectStore(schema.name, {
        keyPath: schema.columns.find(col => col.primaryKey)?.name || 'id'
      });
      
      // 创建索引
      for (const column of schema.columns) {
        if (column.unique || schema.indexes?.some(idx => 
          idx.columns.includes(column.name) && idx.unique
        )) {
          store.createIndex(column.name, column.name, { unique: true });
        } else if (schema.indexes?.some(idx => idx.columns.includes(column.name))) {
          store.createIndex(column.name, column.name, { unique: false });
        }
      }
    };
  }
}
```

## 5. 数据库客户端初始化问题

### 5.1 问题描述

数据库客户端初始化逻辑不一致，导致在某些情况下客户端未正确初始化就被使用。

**常见症状：**

- 运行时出现「数据库未初始化」错误
- 数据库操作偶尔失败，没有明确错误信息
- 在某些环境或条件下数据库操作不可靠

**错误示例：**

```typescript
// 错误示例：没有等待初始化完成
const dbService = DatabaseService.getInstance();
// 没有调用 initialize() 或等待其完成
const users = await dbService.getUsers(); // 可能失败
```

### 5.2 解决方案

#### 5.2.1 使用懒加载初始化

在第一次使用数据库服务时自动初始化：

```typescript
export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private initPromise: Promise<void> | null = null;
  
  private constructor() {
    this.client = DatabaseFactory.createClientFromEnv();
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  private ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.client.initialize();
    }
    return this.initPromise;
  }
  
  async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    return this.client.findAll('users');
  }
  
  // 其他方法也使用 ensureInitialized
}
```

#### 5.2.2 使用初始化状态检查

在每个数据库操作前检查初始化状态：

```typescript
export abstract class BaseClient implements IBaseDatabaseClient {
  protected initialized = false;
  
  // 检查初始化状态
  protected checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('数据库客户端未初始化，请先调用 initialize() 方法');
    }
  }
  
  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    this.checkInitialized();
    // 实现...
  }
  
  // 其他方法也使用 checkInitialized
}
```

#### 5.2.3 使用数据库提供者模式

创建数据库提供者组件，确保在应用启动时初始化数据库：

```tsx
// src/providers/database-provider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DatabaseService } from '@/core/lib/db/service';

interface DatabaseContextType {
  dbService: DatabaseService;
  isInitialized: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const dbService = DatabaseService.getInstance();
  
  useEffect(() => {
    const initDb = async () => {
      try {
        await dbService.initialize();
        setInitialized(true);
      } catch (err) {
        console.error('数据库初始化失败:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    initDb();
    
    return () => {
      dbService.close().catch(console.error);
    };
  }, []);
  
  return (
    <DatabaseContext.Provider value={{ dbService, isInitialized, error }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
```

## 6. 最佳实践总结

### 6.1 类型定义

- 在 `types/` 目录下集中定义所有实体类型
- 使用类型继承保持类型一致性
- 避免重复定义相同实体的类型

### 6.2 接口实现

- 使用抽象基类实现通用逻辑
- 确保实现类完全实现接口定义的所有方法
- 使用 TypeScript 严格模式捕获接口实现问题

### 6.3 导入路径

- 使用一致的导入路径风格（推荐绝对路径）
- 配置路径别名简化导入
- 使用索引文件统一导出

### 6.4 表结构定义

- 使用集中式表结构注册中心
- 为每个表创建单独的结构定义文件
- 使用适配器转换表结构为特定数据库格式

### 6.5 数据库初始化

- 使用懒加载初始化
- 在每个数据库操作前检查初始化状态
- 使用数据库提供者模式确保应用启动时初始化

## 7. 代码审查清单

在提交代码前，请检查以下项目：

- [ ] 是否使用了正确的类型定义？
- [ ] 是否完全实现了接口定义的所有方法？
- [ ] 是否使用了一致的导入路径风格？
- [ ] 是否正确定义和注册了表结构？
- [ ] 是否正确处理了数据库初始化？
- [ ] 是否添加了适当的错误处理？
- [ ] 是否编写了单元测试验证功能？

## 8. 常见错误和解决方法

| 错误信息 | 可能原因 | 解决方法 |
|---------|---------|--------|
| `数据库客户端未初始化` | 在初始化完成前调用了数据库方法 | 确保在使用前调用 `initialize()` 并等待其完成 |
| `找不到表 xxx` | 表名拼写错误或表未创建 | 检查表名拼写，确保表已在 SchemaRegistry 中注册 |
| `属性 xxx 在类型 yyy 上不存在` | 类型定义不一致 | 检查并统一类型定义 |
| `类型 xxx 缺少以下属性: yyy` | 接口实现不完整 | 确保实现类实现了接口的所有方法 |
| `找不到模块 xxx` | 导入路径错误 | 检查导入路径，使用正确的路径格式 |

## 9. 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [SQLite 文档](https://www.sqlite.org/docs.html)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)