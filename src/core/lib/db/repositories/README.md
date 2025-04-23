# 仓储模式（Repository Pattern）实现指南

## 1. 仓储模式概述

仓储模式是一种数据访问模式，它在领域模型和数据映射层之间提供了一个抽象层。在本项目中，仓储模式通过`BaseRepository`抽象类实现，为各种实体提供统一的CRUD操作接口。项目采用模块化设计，**每个表或Schema对应一个独立的仓储类文件**，以提高代码的可维护性和可扩展性。

### 1.1 设计理念

- **关注点分离**：将数据访问逻辑与业务逻辑分离
- **代码复用**：通用CRUD操作在基类中实现，避免重复代码
- **可测试性**：通过依赖注入和接口抽象，便于单元测试
- **类型安全**：利用TypeScript泛型提供类型安全的数据访问

### 1.2 核心组件

- **BaseRepository**：提供通用CRUD操作的抽象基类
- **具体仓储类**：继承BaseRepository，实现特定实体的数据访问逻辑，每个实体对应一个独立的仓储类文件
- **IBaseDatabaseClient**：数据库客户端接口，提供底层数据访问能力
- **工厂类和适配器类**：可选的设计模式，用于组织和管理多个仓储类

## 2. 仓储类实现指南

### 2.1 创建新的仓储类

创建新的仓储类时，应遵循以下步骤：

1. 从`BaseRepository`继承，并指定实体类型
2. 在构造函数中调用父类构造函数，传入数据库客户端和表名
3. 实现特定于该实体的查询方法

```typescript
import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { YourEntity } from '../types';

/**
 * YourEntity仓储类
 * 处理YourEntity相关的数据访问
 */
export class YourEntityRepository extends BaseRepository<YourEntity> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'your_entities'); // 表名应使用复数形式
  }
  
  /**
   * 根据特定条件查询实体
   * @param condition 查询条件
   * @returns 实体列表
   */
  async findByCondition(condition: string): Promise<YourEntity[]> {
    return this.query({
      where: { field: condition }
    });
  }
  
  // 添加其他特定于YourEntity的查询方法
}

## 2.2 接口标准化与命名规范（结合服务设计规范）

### 2.2.1 统一接口标准

- 所有仓储类必须实现统一的仓储接口（如 `IBaseRepository<T>`），接口方法与数据服务（`IDataService`）保持风格一致，便于解耦和类型安全。
- 推荐接口方法：
  - `findById(id: string): Promise<T | null>`
  - `findMany(query?: Partial<T>): Promise<T[]>`
  - `create(data: Partial<T>): Promise<T>`
  - `update(id: string, data: Partial<T>): Promise<T>`
  - `delete(id: string): Promise<void>`
- 所有方法应通过基类方法间接调用数据服务（如 `this.dataService.query()`），**禁止直接依赖底层数据库 client**。
- 复杂业务场景下（如聚合、跨表、事务），可扩展专属接口，但也应保持风格统一，并通过数据服务实现。

#### 数据服务与仓储接口的衔接
- 数据服务接口建议统一采用 `findOne(tableName, id)`、`query(tableName, options)` 等风格，仓储层通过传递表名和参数实现实体级数据访问。
- 示例：
  ```typescript
  // 数据服务接口
  findOne<T>(tableName: string, id: string): Promise<T | null>;
  query<T>(tableName: string, options?: any): Promise<T[]>;
  // 仓储调用
  async findById(id: string): Promise<User | null> {
    return this.dataService.findOne<User>('users', id);
  }
  ```

### 2.2.2 命名与实现规范

- **仓储类名**：`EntityNameRepository`，如 `UserRepository`
- **文件名**：`entity-name-repository.ts` 或 `entity-name.repository.ts`
- **方法命名**：
  - 查询方法：`findByXxx`，如 `findByName`
  - 创建方法：`create` 或 `createXxx`
  - 更新方法：`update` 或 `updateXxx`
  - 删除方法：`delete` 或 `deleteXxx`
  - 特殊操作：使用动词开头，如 `markAsRead`
- **批量/事务方法**：如有批量、事务需求，接口命名应与数据服务保持一致，如 `markMultipleAsRead`、`batchUpdateStatus`、`transaction(...)`。

### 2.2.3 复杂场景仓储接口设计（如 Match/Message）
- 对于聚合、跨表、智能推荐等复杂业务，建议在专属仓储接口中扩展业务方法，如：
  - `findUserMatches(userId: string): Promise<Match[]>`
  - `recommendMatches(userId: string, tags: string[]): Promise<Match[]>`
  - `findByMatchId(matchId: string, page: number, pageSize: number): Promise<Message[]>`
  - `markMultipleAsRead(messageIds: string[]): Promise<void>`
- 这些方法内部依然通过数据服务统一接口实现，保持解耦和可测试性。

---

> 本节接口标准化规范结合了 [service-design-guidelines.md](../../services/service-design-guidelines.md) 的插件化、工厂、注册表和统一接口风格要求，确保仓储层与服务层解耦、类型安全、易于扩展和 mock。

## 3. 常用方法实现模式

### 3.1 基本查询方法

```typescript
// 根据单一条件查询
async findByField(value: any): Promise<Entity[]> {
  return this.query({
    where: { field: value }
  });
}

// 根据多个条件查询
async findByMultipleConditions(condition1: any, condition2: any): Promise<Entity[]> {
  return this.query({
    where: {
      $and: [
        { field1: condition1 },
        { field2: condition2 }
      ]
    }
  });
}

// 根据OR条件查询
async findByEitherCondition(condition1: any, condition2: any): Promise<Entity[]> {
  return this.query({
    where: {
      $or: [
        { field1: condition1 },
        { field2: condition2 }
      ]
    }
  });
}
```

### 3.2 高级查询方法

```typescript
// 分页查询
async findWithPagination(page: number, pageSize: number): Promise<QueryResult<Entity>> {
  return this.query({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: {
      field: 'createdAt',
      direction: 'desc'
    } // 默认按创建时间降序
  });
}

// 复杂条件查询
async findWithComplexConditions(params: ComplexQueryParams): Promise<Entity[]> {
  const { field1, field2, orderBy, limit } = params;
  const whereClause: any = {};
  
  if (field1) whereClause.field1 = field1;
  if (field2) whereClause.field2 = field2;
  
  return this.query({
    where: whereClause,
    orderBy: orderBy || {
      field: 'createdAt',
      direction: 'asc'
    },
    limit: limit || 10
  });
}
```

### 3.3 批量操作方法

```typescript
// 批量创建
async bulkCreate(entities: CreateEntityData<Entity>[]): Promise<void> {
  const operations = entities.map(entity => ({
    type: 'create',
    data: entity
  }));
  
  await this.batch(operations);
}

// 批量更新
async bulkUpdate(updates: { id: string; data: Partial<Entity> }[]): Promise<void> {
  const operations = updates.map(update => ({
    type: 'update',
    id: update.id,
    data: update.data
  }));
  
  await this.batch(operations);
}
```

## 4. 接口标准化与通用仓储设计

### 4.1 通用仓储接口设计原则

- 所有仓储类应实现统一的通用接口（如 `IBaseRepository<T>`），包括：
  - `findById(id: string): Promise<T | null>`
  - `findMany(query?: Partial<T>): Promise<T[]>`
  - `create(data: Partial<T>): Promise<T>`
  - `update(id: string, data: Partial<T>): Promise<T>`
  - `delete(id: string): Promise<void>`
- 通用仓储基类（`BaseRepository<T>`）实现绝大多数实体的标准 CRUD 和分页/排序等通用能力。
- 所有仓储方法应通过基类方法间接调用底层数据服务（如 `IDataService`），避免直接依赖具体数据库客户端。
- 错误处理、事务、分页等横切逻辑应在基类中统一实现，子类只需扩展特殊业务方法。

### 4.2 通用仓储的设计与考虑

- **类型安全**：通过 TypeScript 泛型保证仓储接口与实体类型一致。
- **环境解耦**：仓储依赖统一数据服务接口（如 `IDataService`），数据服务内部再调用各类 client（IndexedDB、SQLite、Mock 等），实现多环境/多数据源透明切换。
- **Mock/测试友好**：通过依赖注入和接口抽象，便于单元测试。
- **推荐用法**：绝大多数实体（如 User、Photo、Quiz 等）直接继承 `BaseRepository<T>`，减少重复代码

### 4.3 复杂业务场景下的仓储设计

对于需要复杂聚合、跨表查询、特殊业务逻辑的实体（如 Match、Message），建议：

- 继承通用仓储基类，复用标准 CRUD 能力
- 在专属仓储类中扩展复杂方法，如：
  - 聚合查询（如 findUserMatches、getUnreadCount）
  - 跨表操作（如联查用户、消息、匹配等）
  - 业务特有操作（如 markAsRead、撤回消息、智能推荐等）
- 复杂方法内部依然通过数据服务接口获取数据，避免直接依赖底层 client
- 可通过组合模式引入聚合/查询构建器等工具类，提升灵活性

#### 示例：Match/Message 仓储的扩展

```typescript
// MatchRepository（复杂聚合/跨表）
export class MatchRepository extends BaseRepository<Match> {
  constructor(dataService: IDataService) {
    super(dataService, 'matches');
  }

  // 复杂聚合方法：获取用户所有相关匹配
  async findUserMatches(userId: string): Promise<Match[]> {
    // 通过数据服务统一接口实现
    return this.query({
      where: {
        $or: [
          { users: [userId] },
          { users: { $elemMatch: userId } }
        ]
      }
    });
  }

  // 跨表/业务聚合：智能推荐、quiz 联动等
  async recommendMatches(userId: string, tags: string[]): Promise<Match[]> {
    // 结合用户标签、兴趣等多条件聚合
    // ...实现细节略
    return [];
  }
}

// MessageRepository（分页、批量、状态聚合）
export class MessageRepository extends BaseRepository<Message> {
  constructor(dataService: IDataService) {
    super(dataService, 'messages');
  }

  // 分页查询某个 match 下的消息
  async findByMatchId(matchId: string, page: number, pageSize: number): Promise<Message[]> {
    return this.query({
      where: { matchId },
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  // 批量标记为已读
  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    // 通过数据服务的事务支持实现批量操作
    await this.dataService.transaction(async () => {
      for (const id of messageIds) {
        await this.update(id, { status: 'read' });
      }
    });
  }
}
```

### 4.4 设计要点小结

- **通用优先**：绝大多数实体直接用 `BaseRepository<T>`，减少重复代码
- **复杂场景扩展**：聚合/跨表/特殊业务通过专属仓储扩展
- **接口标准化**：所有仓储实现统一接口，便于服务层、hooks、测试、mock
- **环境无关**：仓储只依赖数据服务接口，底层细节完全屏蔽
- **组合与继承结合**：可用组合/聚合模式引入灵活扩展工具类

---

如需批量生成通用仓储模板、复杂仓储扩展示例或自动注册脚本，请参考本节示例或联系架构负责人。

## 5. 测试仓储类

### 5.1 单元测试

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourEntityRepository } from './your-entity-repository';
import { MockDatabaseClient } from '../test/types/mock.types';

describe('YourEntityRepository', () => {
  let mockClient: MockDatabaseClient;
  let repository: YourEntityRepository;

  beforeEach(() => {
    // 创建模拟的数据库客户端
    mockClient = {
      findById: vi.fn(),
      findAll: vi.fn(),
      // ... 其他方法 ...
    };

    repository = new YourEntityRepository(mockClient);
  });

  it('should find entities by condition', async () => {
    // 设置模拟返回值
    mockClient.query.mockResolvedValue({
      data: [{ id: '1', name: 'Test' }],
      total: 1,
      hasMore: false
    });

    // 调用被测试方法
    const result = await repository.findByCondition('test');

    // 验证结果
    expect(mockClient.query).toHaveBeenCalledWith(
      'your_entities',
      expect.objectContaining({
        where: { field: 'test' }
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
  });
});

## 6. Lessons Learned From Consistency Fixes

在数据库一致性修复任务中，我们总结了以下关于仓储模式实现的关键经验教训：

### 6.1 使用基类方法而非直接访问客户端

- **问题**：部分仓储类直接使用了数据库客户端方法而非通过基类方法，导致抽象层被破坏
- **解决方案**：统一使用基类提供的方法
  ```typescript
  // 错误示例
  async findByName(name: string): Promise<User[]> {
    return await this.client.query('users', {
      where: { name }
    });
  }
  
  // 正确示例
  async findByName(name: string): Promise<User[]> {
    return await this.query({
      where: { name }
    });
  }
  ```
- **最佳实践**：
  - 始终使用基类方法而非直接访问客户端
  - 使用基类的`query`、`create`、`update`、`delete`等方法
  - 避免在仓储类中引入对特定数据库客户端实现的依赖

### 6.2 一致的错误处理模式

- **问题**：缺少统一的错误处理导致调试困难，异常信息不完整
- **解决方案**：在所有仓储方法中采用一致的错误处理模式
  ```typescript
  async findByName(name: string): Promise<User[]> {
    try {
      return await this.query({
        where: { name }
      });
    } catch (error) {
      throw new DatabaseError(
        `查找用户名为 ${name} 的用户失败`,
        'QUERY_ERROR',
        { name, error }
      );
    }
  }
  ```
- **最佳实践**：
  - 使用专用的`DatabaseError`类封装所有数据库错误
  - 错误消息应包含操作类型和相关参数信息
  - 使用try-catch块包装所有数据库操作
  - 在错误上下文中包含原始错误和操作参数，便于调试

### 6.3 事务支持的重要性

- **问题**：批量操作缺乏事务支持，导致数据一致性风险
- **解决方案**：对需要原子性的批量操作使用事务
  ```typescript
  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    try {
      // 使用事务确保原子性操作
      await this.transaction(async () => {
        const updatePromises = messageIds.map(id => this.update(id, { 
          status: 'read' as const,
          updatedAt: new Date()
        }));
        await Promise.all(updatePromises);
      });
    } catch (error) {
      throw new DatabaseError(
        `批量标记消息为已读失败`,
        'UPDATE_ERROR',
        { messageIds, error }
      );
    }
  }
  ```
- **最佳实践**：
  - 识别需要原子性的操作场景，如批量更新和关联数据修改
  - 使用仓储基类提供的`transaction`方法
  - 在事务内处理所有相关操作
  - 确保事务回滚时有适当的错误处理

### 6.4 提高类型安全

- **问题**：类型断言和类型不匹配导致潜在的运行时错误
- **解决方案**：使用适当的类型参数和类型声明
  ```typescript
  // 错误示例 - 使用any类型和不必要的类型断言
  async createMatch(users: any): Promise<Match> {
    return await this.create(users as Match);
  }
  
  // 正确示例 - 严格类型定义和必要的类型断言
  async createMatch(users: [string, string], status: Match['status'] = 'pending'): Promise<Match> {
    const matchData = {
      users,
      status
    };
    return await this.create(matchData);
  }
  ```
- **最佳实践**：
  - 避免使用`any`类型
  - 为方法参数和返回值提供精确的类型声明
  - 使用类型参数而非类型断言，必要时使用`as const`断言
  - 导入并使用`types`目录中定义的类型接口

### 6.5 方法命名规范化

- **问题**：方法命名不一致导致API使用混乱
- **解决方案**：遵循一致的命名约定
  ```typescript
  // 查询方法使用find前缀
  async findByUserId(userId: string): Promise<Match[]>
  
  // 创建方法使用create前缀
  async createMessage(data: CreateMessageData): Promise<Message>
  
  // 更新方法使用update前缀
  async updateStatus(matchId: string, status: Match['status']): Promise<void>
  
  // 特殊操作使用动词开头
  async markAsRead(messageId: string): Promise<void>
  
  // 计数方法使用count或get...Count
  async getUnreadCount(userId: string): Promise<number>
  ```
- **最佳实践**：
  - 查询方法：使用`find`前缀，如`findById`、`findByName`
  - 创建方法：使用`create`前缀
  - 更新方法：使用`update`前缀
  - 删除方法：使用`delete`前缀
  - 特殊操作：使用动词开头，如`markAsRead`、`activate`
  - 在团队内统一并记录命名约定

通过遵循这些经验教训，可以显著提高仓储实现的质量和一致性，减少常见错误，并使代码更易于理解和维护。

## 7. 仓储注册表 + 工厂 + 适配器模式

### 7.1 架构说明

- **注册表（Registry）**：集中注册和获取所有仓储实例，支持多实现、动态切换、Mock、插件化等场景。
- **工厂（Factory）**：负责根据配置/环境动态创建仓储实例，支持依赖注入、单例、多环境等。
- **适配器（Adapter）**：底层数据服务适配器，屏蔽不同数据库/Mock/远端实现，仓储层只依赖统一接口。

### 7.2 推荐目录结构

```
repositories/
  ├── adapters/         # 仓储适配器
  ├── factory/          # 仓储工厂
  ├── registry/         # 仓储注册表
  ├── user-repository.ts
  ├── match-repository.ts
  └── ...
```

### 7.3 示例代码

```typescript
// 仓储工厂
export class RepositoryFactory {
  static createUserRepository(dataService: IDataService): UserRepository {
    return new UserRepository(dataService);
  }
  // ...其它实体
}

// 仓储注册表
export class RepositoryRegistry {
  private static repositories: Record<string, any> = {};

  static register(name: string, repo: any) {
    this.repositories[name] = repo;
  }

  static get<T>(name: string): T {
    return this.repositories[name];
  }
}

// 注册所有仓储（可在应用初始化时）
RepositoryRegistry.register('user', RepositoryFactory.createUserRepository(dataService));
RepositoryRegistry.register('match', RepositoryFactory.createMatchRepository(dataService));

// 业务层/Hook 获取仓储实例
const userRepository = RepositoryRegistry.get<UserRepository>('user');
```

### 7.4 设计要点

- 所有业务代码、hooks、服务层**只能通过注册表获取仓储实例**，禁止直接 new。
- 支持运行时注册新适配器/Mock，实现插件化、A/B 测试、灰度等。
- 工厂负责动态注入 dataService 或其它依赖，注册表负责全局唯一和统一管理。
- 适配器层可根据环境变量选择不同数据服务实现（如 IndexedDB、SQLite、Mock）。

---

如需自动生成注册表/工厂/适配器代码模板，或进一步细化文档，请参考本节内容或联系架构负责人。