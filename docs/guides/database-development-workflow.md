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

Schema Registry 负责管理所有表结构定义，提供统一的注册和访问接口。详细设计请参考[数据库模式设计指南](./database-schema-design.md)。

#### 2.2.2 数据库工厂

数据库工厂负责创建和管理数据库客户端实例，根据环境变量选择合适的客户端类型。详细API请参考[数据库API文档](./api/database-api.md)。

#### 2.2.3 数据库服务

数据库服务是应用程序与数据库交互的主要入口点，管理数据库客户端和仓储实例。

## 3. 开发流程

### 3.1 Mock数据阶段

在开发初期，使用Mock数据进行快速原型开发和功能验证：

**主要特点：**

- 快速开发，无需设置实际数据库
- 可预测的测试数据
- 不依赖实际数据库环境

**实现步骤：**

1. 在`src/mock/data/`目录创建模拟数据文件
2. 实现Mock数据服务
3. 验证UI和业务逻辑

**环境配置：**

```
NEXT_PUBLIC_DATABASE_ENV=mock
```

**完成标准：**

- [ ] 模拟数据结构与实际需求一致
- [ ] UI组件能正确显示模拟数据
- [ ] 基本业务逻辑验证通过

### 3.2 本地数据库阶段

在功能基本确认后，进入本地数据库开发阶段：

**主要特点：**

- 数据持久化
- 测试数据库操作性能
- 验证查询和事务逻辑

**实现步骤：**

1. 设计数据库Schema
2. 创建数据库迁移脚本
3. 实现本地数据库服务

**环境配置：**

```
NEXT_PUBLIC_DATABASE_ENV=local
```

**完成标准：**

- [ ] 数据库Schema设计合理
- [ ] 迁移脚本正确执行
- [ ] 数据持久化功能正常

### 3.3 生产环境数据库阶段

最后，实现生产环境数据库支持：

**主要特点：**

- 多用户支持
- 安全性和可扩展性
- 数据同步和离线支持

**实现步骤：**

1. 选择云端数据库服务：
   - Firebase Realtime Database/Firestore
   - Supabase
   - 其他云数据库服务
2. 配置安全规则和访问控制
3. 实现云端数据库服务和离线数据存储

**环境配置：**

```
NEXT_PUBLIC_DATABASE_ENV=production
```

**完成标准：**

- [ ] 云端数据库配置正确
- [ ] 数据库连接稳定可靠
- [ ] 安全规则配置合理

## 4. 环境切换

为确保在不同数据库环境之间平滑切换，请遵循以下最佳实践：

1. **服务初始化检查**：所有数据库服务必须在初始化时检查配置的完整性
2. **优雅降级策略**：当高级环境配置缺失时，自动降级到基础环境
3. **详细日志**：记录当前使用的数据库环境和初始化状态

在开发过程中，可以通过以下方式在不同数据库环境之间切换：

```bash
# Mock数据环境
NEXT_PUBLIC_DATABASE_ENV=mock npm run dev

# 本地数据库环境
NEXT_PUBLIC_DATABASE_ENV=local npm run dev

# 生产环境数据库
NEXT_PUBLIC_DATABASE_ENV=production npm run dev
```

## 5. 添加新表

当需要添加新的数据库表时，请按照以下步骤操作：

### 5.1 定义表结构

在 `src/core/lib/db/schema/definitions/` 目录下创建新的表结构定义文件：

```typescript
// src/core/lib/db/schema/definitions/example-schema.ts
import { TableSchema, ColumnType } from '../types';

export const exampleSchema: TableSchema = {
  name: 'examples',
  columns: [
    { name: 'id', type: ColumnType.STRING, primaryKey: true },
    { name: 'name', type: ColumnType.STRING, nullable: false },
    { name: 'description', type: ColumnType.STRING, nullable: true },
    { name: 'createdAt', type: ColumnType.DATE, nullable: false },
    { name: 'updatedAt', type: ColumnType.DATE, nullable: false },
  ],
  indexes: [
    { name: 'idx_example_name', columns: ['name'] },
  ]
};
```

### 5.2 注册表结构

在应用启动时注册表结构：

```typescript
// src/core/lib/db/schema/index.ts
import { SchemaRegistry } from './registry';
import { userSchema } from './definitions/user-schema';
import { matchSchema } from './definitions/match-schema';
import { messageSchema } from './definitions/message-schema';
import { exampleSchema } from './definitions/example-schema';

export function registerSchemas(): void {
  const registry = SchemaRegistry.getInstance();
  registry.register(userSchema);
  registry.register(matchSchema);
  registry.register(messageSchema);
  registry.register(exampleSchema); // 注册新表
}
```

### 5.3 创建仓储类

在 `src/core/lib/db/repositories/` 目录下创建新的仓储类：

```typescript
// src/core/lib/db/repositories/example-repository.ts
import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Example } from '../types/dating';

export class ExampleRepository extends BaseRepository<Example> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'examples');
  }
  
  // 添加特定于Example的方法
  async findByName(name: string): Promise<Example[]> {
    return this.findBy({ name });
  }
}
```

### 5.4 更新类型定义

在 `src/core/lib/db/types/dating.ts` 文件中添加新实体的类型定义：

```typescript
// src/core/lib/db/types/dating.ts
import { BaseEntity } from './base-entity';

// 已有类型定义...

// 新增Example类型
export interface Example extends BaseEntity {
  name: string;
  description?: string;
}
```

### 5.5 更新 DatabaseService 类

最后，更新 DatabaseService 类，添加新的仓储和相关方法：

```typescript
// src/core/lib/db/service.ts
import { ExampleRepository } from './repositories/example-repository';

export class DatabaseService {
  // 已有代码...
  
  private exampleRepository: ExampleRepository;
  
  private constructor() {
    // 已有初始化代码...
    
    this.exampleRepository = new ExampleRepository(this.client);
  }
  
  // 获取Example仓储
  getExampleRepository(): ExampleRepository {
    this.checkInitialized();
    return this.exampleRepository;
  }
}
```

## 6. 组件与页面数据访问模式

### 6.1 错误示例

```typescript
// 错误示例：直接导入mock数据
import { getRecommendedUsers } from '@/core/models/mock-data';

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

## 8. 常见问题与解决方案

数据库开发过程中可能遇到各种问题，请参考[数据库开发常见问题与解决方案](./database-troubleshooting.md)文档，其中包含了详细的问题描述和解决方法。

常见问题类型包括：

1. 类型定义不一致问题
2. 接口实现不完整问题
3. 数据库表结构定义不一致问题
4. 数据库客户端初始化问题
5. 数据库连接和事务问题

## 9. 开发检查清单

### 9.1 数据库开发前

- [ ] 是否已明确数据实体及其关系？
- [ ] 是否已设计数据模型？
- [ ] 是否已确定数据访问模式？

### 9.2 Mock数据阶段

- [ ] 是否创建了符合实际需求的模拟数据？
- [ ] 是否实现了模拟数据服务？
- [ ] 是否验证了UI和基本业务逻辑？

### 9.3 本地数据库阶段

- [ ] 是否设计了合理的数据库Schema？
- [ ] 是否实现了数据库迁移脚本？
- [ ] 是否实现了本地数据库服务？
- [ ] 是否测试了数据持久化功能？

### 9.4 生产环境数据库阶段

- [ ] 是否选择了合适的云端数据库服务？
- [ ] 是否配置了云端数据库服务？
- [ ] 是否实现了数据同步和离线支持？
- [ ] 是否配置了安全规则和访问控制？

## 10. 故障排除

| 类别 | 问题 | 解决方案 |
|------|------|----------|
| 数据库 | Firebase初始化错误 | 1. 检查环境变量配置<br>2. 确保服务实现了优雅降级策略<br>3. 参考[数据库初始化与降级策略](./lessons/database/firebase-initialization-fallback.md) |
| 数据库 | 环境切换后数据丢失 | 1. 使用`--env-file`参数指定正确的环境文件<br>2. 确保数据同步服务正常工作<br>3. 检查数据库连接配置 |
| 数据库 | 表结构变更导致应用崩溃 | 1. 实现版本迁移策略<br>2. 使用Schema Registry管理表结构<br>3. 添加表结构验证逻辑 |

## 总结

本文档详细描述了项目的数据库开发工作流程，从Mock数据阶段到生产环境数据库阶段，提供了完整的指导和最佳实践。通过遵循这些规范和流程，可以确保数据库开发的一致性、可靠性和可维护性，为应用程序提供稳定的数据访问层。

更多详细信息，请参考以下相关文档：

- [数据库模式设计指南](./database-schema-design.md)
- [数据库开发常见问题与解决方案](./database-troubleshooting.md)
- [数据库API文档](./api/database-api.md)
- [数据库性能优化指南](./performance-optimization.md)