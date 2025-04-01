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
```

### 2.2 命名规范

- **仓储类名**：`EntityNameRepository`，如`UserRepository`
- **文件名**：`entity-name-repository.ts`或`entity-name.repository.ts`
- **方法命名**：
  - 查询方法：`findByXxx`，如`findByName`
  - 创建方法：`create`或`createXxx`
  - 更新方法：`update`或`updateXxx`
  - 删除方法：`delete`或`deleteXxx`
  - 特殊操作：使用动词开头，如`markAsRead`

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

## 4. 模块化设计与仓储类组织

### 4.1 模块化设计原则

- **单一职责原则**：每个仓储类只负责一个实体的数据访问，一个表对应一个仓储类文件
- **文件命名规范**：使用`entity-name-repository.ts`的命名方式，如`user-repository.ts`
- **导出管理**：在`index.ts`中统一导出所有仓储类，便于其他模块引用
- **独立实现**：每个仓储类应独立实现其特定的查询方法，不应依赖其他仓储类

### 4.2 仓储类组织模式

- **直接使用**：对于简单场景，可以直接实例化并使用单个仓储类
- **工厂模式**：使用工厂类统一创建和管理相关的仓储类
- **适配器模式**：使用适配器类，对外提供统一接口，内部使用模块化的仓储类

### 4.3 避免代码冗余的最佳实践

- 使用`BaseRepository`提供的通用CRUD方法，避免在每个仓储类中重复实现
- 对于多个仓储类共享的查询逻辑，考虑在`BaseRepository`中添加通用方法

### 4.2 提取共享逻辑

- 对于多个仓储类中相似的查询逻辑，考虑创建工具函数或扩展`BaseRepository`

```typescript
// 在BaseRepository中添加通用方法
export abstract class BaseRepository<T extends BaseEntity> {
  // ... 现有方法 ...
  
  /**
   * 分页查询通用方法
   */
  async findPaginated(page: number, pageSize: number, orderBy?: { field: string; direction: 'asc' | 'desc' }): Promise<QueryResult<T>> {
    return this.query({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: orderBy || {
        field: 'createdAt',
        direction: 'desc'
      }
    });
  }
}
```

### 4.3 使用组合而非继承

- 对于不适合放在`BaseRepository`中的共享逻辑，考虑使用组合模式

```typescript
// 创建一个查询构建器类
class QueryBuilder<T> {
  constructor(private repository: BaseRepository<T>) {}
  
  withPagination(page: number, pageSize: number): QueryBuilder<T> {
    // 实现分页逻辑
    return this;
  }
  
  withFilter(filter: any): QueryBuilder<T> {
    // 实现过滤逻辑
    return this;
  }
  
  async execute(): Promise<QueryResult<T>> {
    // 执行查询
    return this.repository.query(/* 构建的查询参数 */);
  }
}

// 在仓储类中使用
class SomeRepository extends BaseRepository<SomeEntity> {
  createQueryBuilder(): QueryBuilder<SomeEntity> {
    return new QueryBuilder<SomeEntity>(this);
  }
}
```

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
```

## 6. 常见问题与解决方案

### 6.1 处理复杂查询

对于复杂查询，可以使用以下策略：

1. 使用`query`方法的高级选项
2. 使用`executeRawQuery`方法执行原始SQL查询
3. 创建专门的查询构建器类

### 6.2 处理关联数据

对于关联数据，可以：

1. 在仓储类中实现专门的方法，如`findUserWithPosts`
2. 使用事务确保数据一致性
3. 考虑使用数据加载器（DataLoader）模式优化性能

### 6.3 性能优化

- 使用适当的索引
- 限制查询结果数量
- 只选择需要的字段
- 使用批量操作代替多次单独操作

## 7. 多仓储类的集成与管理

### 7.1 使用工厂模式管理多个仓储

工厂模式是管理多个相关仓储类的有效方式：

```typescript
// 创建工厂类示例
class RepositoryFactory {
  private client: IBaseDatabaseClient;
  private userRepository: UserRepository | null = null;
  private matchRepository: MatchRepository | null = null;
  
  constructor(client: IBaseDatabaseClient) {
    this.client = client;
  }
  
  getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.client);
    }
    return this.userRepository;
  }
  
  getMatchRepository(): MatchRepository {
    if (!this.matchRepository) {
      this.matchRepository = new MatchRepository(this.client);
    }
    return this.matchRepository;
  }
}

// 使用工厂类
const repositoryFactory = new RepositoryFactory(databaseClient);

// 获取特定的仓储类
const userRepository = repositoryFactory.getUserRepository();
const matchRepository = repositoryFactory.getMatchRepository();

// 使用仓储类
const user = await userRepository.findById('user-id');
const matches = await matchRepository.findByUserId('user-id');
```

### 7.2 使用适配器模式保持接口一致性

适配器模式可以在保持向后兼容性的同时实现代码模块化：

```typescript
// 适配器模式示例
class RepositoryAdapter {
  private userRepository: UserRepository;
  private photoRepository: PhotoRepository;
  
  constructor(client: IBaseDatabaseClient) {
    this.userRepository = new UserRepository(client);
    this.photoRepository = new PhotoRepository(client);
  }
  
  // 提供统一的接口
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
  
  async getUserPhotos(userId: string): Promise<Photo[]> {
    return this.photoRepository.findByUserId(userId);
  }
}

// 使用适配器
const repositoryAdapter = new RepositoryAdapter(databaseClient);

// 通过统一接口访问不同实体的数据
const user = await repositoryAdapter.getUserById('user-id');
const photos = await repositoryAdapter.getUserPhotos('user-id');
```

### 7.3 依赖注入与服务定位

在应用程序中注册和获取仓储类：

```typescript
// 在服务容器中注册仓储类
container.register('userRepository', () => new UserRepository(databaseClient));
container.register('photoRepository', () => new PhotoRepository(databaseClient));

// 在需要的地方获取仓储类
const userRepository = container.resolve('userRepository');
```

## 8. 总结

仓储模式为应用程序提供了一个清晰、一致的数据访问层。通过采用模块化设计，每个表或Schema对应一个独立的仓储类文件，可以提高代码的可维护性和可扩展性。通过工厂模式和适配器模式，可以有效地组织和管理多个仓储类，同时保持接口的一致性。遵循本指南中的最佳实践，可以创建易于维护、测试和扩展的仓储类，同时避免代码冗余。