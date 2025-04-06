# 添加新数据表指南

本文档提供了在项目中添加新数据表的完整流程和最佳实践。遵循这些步骤可以确保新表与现有架构保持一致，并支持多环境数据存储和同步。

## 1. 数据模型定义

### 1.1 创建 Schema 定义

在 `src/core/lib/db/schema/definitions/` 目录下创建新的 schema 文件：

```typescript
// src/core/lib/db/schema/definitions/test-schema.ts
import { TableSchema } from '@/core/lib/db/schema/types';

export const testSchema: TableSchema = {
  name: 'test_types',
  syncConfig: {
    offlineEnabled: true,
    syncDirection: 'both',
    syncPriority: 'medium'
  },
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
      name: 'description',
      type: 'text',
      notNull: true
    },
    {
      name: 'icon',
      type: 'string',
      notNull: true
    },
    {
      name: 'color',
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
      name: 'idx_test_types_name',
      columns: ['name']
    }
  ]
};
```

### 1.2 注册 Schema

在 `src/core/lib/db/schema/index.ts` 中注册新 schema：

```typescript
import { schemaRegistry } from './registry';
import { testSchema } from './definitions/test-schema';

schemaRegistry.registerSchema(testSchema);
```

## 2. 数据访问层实现

### 2.1 创建仓储类

在 `src/core/lib/db/repositories/` 目录下创建仓储实现：

```typescript
// src/core/lib/db/repositories/test-repository.ts
import { BaseRepository } from './base-repository';
import { TestType } from '@/core/lib/db/types/test';
import { DatabaseService } from '@/core/lib/db/service';

export class TestTypeRepository extends BaseRepository<TestType> {
  constructor() {
    super(DatabaseService.getInstance(), 'test_types');
  }

  async findByUserId(userId: string): Promise<TestType[]> {
    const result = await this.query({
      where: { userId }
    });
    return result.data;
  }
}
```

### 2.2 创建服务类

在 `src/core/lib/db/service/` 目录下创建服务实现：

```typescript
// src/core/lib/db/service/test-service.ts
import { DatabaseService } from './database';
import { TestTypeRepository } from '@/core/lib/db/repositories/test-repository';
import { TestType } from '@/core/lib/db/types/test';

export class TestDataService {
  private static instance: TestDataService;
  private repository: TestTypeRepository;

  private constructor() {
    this.repository = new TestTypeRepository();
  }

  public static getInstance(): TestDataService {
    if (!TestDataService.instance) {
      TestDataService.instance = new TestDataService();
    }
    return TestDataService.instance;
  }

  async getTestTypes(): Promise<TestType[]> {
    return this.repository.findAll();
  }
}
```

## 3. 环境适配

### 3.1 Mock 数据实现

在 `src/core/lib/db/clients/mock/` 目录下创建 Mock 数据：

```typescript
// src/core/lib/db/clients/mock/test-data.ts
import { TestType } from '@/core/lib/db/types/test';

export const mockTestTypes: TestType[] = [
  {
    id: '1',
    name: '性格测试',
    description: '了解你的性格特点',
    icon: 'person',
    color: '#4F46E5',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
```

### 3.2 本地数据库实现

在 `src/core/lib/db/clients/indexeddb/` 或 `src/core/lib/db/clients/capacitor-sqlite/` 目录下添加表定义：

```typescript
// src/core/lib/db/clients/indexeddb/test-store.ts
export const testStore = {
  name: 'test_types',
  keyPath: 'id',
  indexes: [
    { name: 'name', keyPath: 'name', unique: false }
  ]
};
```

## 4. 测试实现

### 4.1 单元测试

在 `src/core/lib/db/test/` 目录下创建测试文件：

```typescript
// src/core/lib/db/test/test-service.test.ts
import { TestDataService } from '@/core/lib/db/service/test-service';
import { mockTestTypes } from '@/core/lib/db/clients/mock/test-data';

describe('TestDataService', () => {
  let service: TestDataService;

  beforeEach(() => {
    service = TestDataService.getInstance();
  });

  it('should get test types', async () => {
    const types = await service.getTestTypes();
    expect(types).toEqual(mockTestTypes);
  });
});
```

## 5. 同步配置

在 `src/core/lib/db/sync/` 目录下添加同步配置：

```typescript
// src/core/lib/db/sync/test-sync.ts
export const testSyncConfig = {
  table: 'test_types',
  strategy: 'offline-first',
  conflictResolution: 'last-write-wins'
};
```

## 6. 最佳实践

1. **类型安全**：使用 TypeScript 类型定义确保类型安全
2. **单例模式**：服务类使用单例模式确保全局唯一实例
3. **依赖注入**：通过构造函数注入依赖，便于测试
4. **错误处理**：实现统一的错误处理机制
5. **日志记录**：添加适当的日志记录，便于调试
6. **测试覆盖**：确保新功能有完整的测试覆盖
7. **文档更新**：更新相关文档，包括 API 文档和类型定义

## 7. 注意事项

1. 确保新表支持所有环境（Mock、Local、Production）
2. 实现适当的同步策略
3. 添加必要的索引以提高查询性能
4. 考虑数据迁移策略
5. 实现适当的错误处理和回滚机制 