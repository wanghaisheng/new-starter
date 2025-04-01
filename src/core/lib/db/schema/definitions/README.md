# 数据库表结构定义指南

本文档详细说明了如何在项目中新增数据库表结构定义，包括表结构定义的标准格式、命名规范、必要的字段类型、索引定义方法以及如何正确注册到SchemaRegistry。

## 1. 表结构定义流程

新增表结构定义的基本流程如下：

1. 在 `src/core/lib/db/schema/definitions/` 目录下创建新的表结构定义文件
2. 在 `src/core/lib/db/types/` 目录下定义对应的实体类型接口
3. 定义表结构（表名、列定义、索引等）
4. 将表结构注册到 SchemaRegistry
5. 导出表结构
6. 更新 drizzle-schema.ts 文件（如果使用 Drizzle ORM）
7. 创建对应的模型类和仓储类（可选）

## 2. 创建表结构定义文件

### 2.1 文件命名规范

- 单表定义：使用 `表名-schema.ts` 格式，例如：`user-schema.ts`
- 多表定义：使用 `领域名-schemas.ts` 格式，例如：`dating-schemas.ts`

### 2.2 基本文件结构

```typescript
// 导入必要的依赖
import { schemaRegistry, TableSchema } from '../index';

// 定义表结构
const exampleSchema: TableSchema = {
  name: 'examples', // 表名使用小写复数形式
  columns: [
    // 列定义...
  ],
  indexes: [
    // 索引定义...
  ]
};

// 注册表结构
schemaRegistry.register(exampleSchema);

// 导出表结构
export default exampleSchema;
```

## 3. 表结构定义规范

### 3.1 命名规范

- **表名**：使用小写复数形式（例如：`users`, `matches`, `messages`）
- **列名**：使用驼峰命名法（例如：`firstName`, `createdAt`, `isActive`）
- **主键**：通常命名为 `id`
- **外键**：使用关联表名的单数形式加上 `Id`（例如：`userId`, `matchId`）
- **索引**：使用 `idx_表名_字段名` 格式（例如：`idx_users_email`）
- **唯一约束**：使用 `idx_表名_字段名` 格式，并设置 `unique: true`

### 3.2 表结构定义示例

```typescript
const exampleSchema: TableSchema = {
  name: 'examples',
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
      name: 'userId',
      type: 'string',
      notNull: true,
      references: {
        table: 'users',
        column: 'id'
      }
    },
    {
      name: 'isActive',
      type: 'boolean',
      notNull: true,
      defaultValue: true
    },
    {
      name: 'data',
      type: 'json'
    },
    {
      name: 'description',
      type: 'text'
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
      name: 'idx_examples_name',
      columns: ['name'],
      unique: true
    },
    {
      name: 'idx_examples_user',
      columns: ['userId']
    },
    {
      name: 'idx_examples_created_at',
      columns: ['createdAt']
    }
  ]
};
```

## 4. 列定义参数说明

每个列定义可以包含以下参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 列名，使用驼峰命名法 |
| `type` | ColumnType | 列类型，可选值：'string', 'number', 'boolean', 'date', 'json', 'text', 'blob', 'array', 'object' |
| `primaryKey` | boolean | 是否为主键 |
| `notNull` | boolean | 是否不允许为空 |
| `unique` | boolean | 是否唯一 |
| `defaultValue` | any | 默认值，可以是值或函数 |
| `references` | object | 外键引用，包含 table 和 column 属性 |

## 5. 索引定义参数说明

每个索引定义可以包含以下参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 索引名称，使用 `idx_表名_字段名` 格式 |
| `columns` | string[] | 索引列名数组 |
| `unique` | boolean | 是否为唯一索引 |

## 6. 多表定义示例

如果需要在一个文件中定义多个相关表，可以参考以下示例：

```typescript
import { schemaRegistry, TableSchema } from '../index';

// 定义第一个表
export const table1Schema: TableSchema = {
  name: 'table1',
  columns: [
    // 列定义...
  ],
  indexes: [
    // 索引定义...
  ]
};

// 定义第二个表
export const table2Schema: TableSchema = {
  name: 'table2',
  columns: [
    // 列定义...
  ],
  indexes: [
    // 索引定义...
  ]
};

// 注册所有表结构
schemaRegistry.register(table1Schema);
schemaRegistry.register(table2Schema);

// 导出所有表结构
export default {
  table1Schema,
  table2Schema
};
```

## 7. 完整的新增表流程

新增表不仅需要定义表结构，还需要进行其他相关配置。完整流程请参考 [新增表指南](../../../docs/guides/add-new-table.md)，包括：

1. 创建表结构定义
2. 更新 drizzle-schema.ts 文件
3. 创建数据模型
4. 创建仓储类
5. 更新数据库客户端

## 8. 最佳实践

- 始终包含 `id`、`createdAt` 和 `updatedAt` 字段
- 为频繁查询的字段创建索引
- 使用外键引用维护数据完整性
- 遵循命名规范，保持一致性
- 为所有表结构添加详细注释
- 在定义完表结构后，确保正确注册到 SchemaRegistry

## 9. Lessons Learned From Consistency Fixes

在数据库一致性修复任务中，我们总结了以下关于表结构定义的关键经验教训：

### 9.1 确保与模型实现一致性

- **问题**：表结构定义与模型实现不一致导致数据映射错误
- **解决方案**：同时更新表结构和模型实现
  ```typescript
  // 模型类
  export class Message implements MessageType, BaseEntity {
    // ...
    type: 'text' | 'image'; // 模型使用type字段
    // ...
  }
  
  // 表结构定义
  const messageSchema: TableSchema = {
    name: 'messages',
    columns: [
      // ...
      {
        name: 'type', // 确保与模型字段名称一致
        type: 'string',
        notNull: true,
        defaultValue: 'text'
      },
      // ...
    ]
    // ...
  };
  ```
- **最佳实践**：
  - 同步维护表结构定义和模型实现
  - 确保字段名称、类型和约束保持一致
  - 使用工具函数验证表结构和模型的一致性
  - 在添加新字段时首先修改表结构定义

### 9.2 完善的索引定义

- **问题**：缺少适当的索引导致查询性能差
- **解决方案**：为常用查询条件添加索引
  ```typescript
  const userSchema: TableSchema = {
    name: 'users',
    // ...
    indexes: [
      {
        name: 'idx_users_email',
        columns: ['email'],
        unique: true
      },
      {
        name: 'idx_users_last_active',
        columns: ['lastActive']
      },
      {
        name: 'idx_users_location',
        columns: ['location']
      }
    ]
  };
  ```
- **最佳实践**：
  - 为所有外键添加索引（如`userId`、`matchId`）
  - 为经常用于过滤或排序的字段添加索引（如`status`、`createdAt`）
  - 为唯一性约束的字段添加唯一索引（如`email`、`phone`）
  - 为全文搜索字段添加特殊索引（如`name`、`bio`）
  - 避免过度索引，权衡索引带来的查询性能提升和写入性能影响

### 9.3 适当的约束定义

- **问题**：缺少适当的约束导致数据完整性问题
- **解决方案**：定义必要的数据约束
  ```typescript
  const matchSchema: TableSchema = {
    name: 'matches',
    columns: [
      // ...
      {
        name: 'status',
        type: 'string',
        notNull: true,
        defaultValue: 'pending',
        check: "status IN ('pending', 'matched', 'rejected')" 
      },
      // ...
    ]
  };
  ```
- **最佳实践**：
  - 使用`notNull`约束确保必填字段不为空
  - 使用`defaultValue`提供合理的默认值
  - 使用`check`约束验证枚举值的有效性
  - 使用`references`定义外键关系
  - 使用唯一索引定义唯一性约束

### 9.4 JSON字段的处理

- **问题**：JSON字段处理不当导致数据访问和查询困难
- **解决方案**：正确定义和使用JSON字段
  ```typescript
  const userSchema: TableSchema = {
    name: 'users',
    columns: [
      // ...
      {
        name: 'preferences',
        type: 'json',
        notNull: true,
        defaultValue: '{}' // 提供有效的默认JSON
      },
      // ...
    ]
  };
  ```
- **最佳实践**：
  - 为JSON字段提供有效的默认值（通常是空对象或数组）
  - 在模型层处理JSON序列化和反序列化
  - 为经常查询的JSON属性创建计算列或单独的实体表
  - 注意不同数据库对JSON字段查询的支持差异
  - 适当使用JSON模式验证确保数据一致性

### 9.5 关系定义的重要性

- **问题**：缺少明确的关系定义导致数据完整性和查询问题
- **解决方案**：使用`references`属性定义关系
  ```typescript
  const messageSchema: TableSchema = {
    name: 'messages',
    columns: [
      // ...
      {
        name: 'matchId',
        type: 'string',
        notNull: true,
        references: {
          table: 'matches',
          column: 'id',
          onDelete: 'CASCADE'
        }
      },
      // ...
    ]
  };
  ```
- **最佳实践**：
  - 为所有外键定义`references`属性
  - 明确指定引用的表和列
  - 根据业务需求选择适当的`onDelete`和`onUpdate`行为
  - 为多对多关系创建关联表
  - 在模型和仓储层实现关系查询方法

### 9.6 统一的表命名和字段命名

- **问题**：不一致的表名和字段命名导致使用混乱
- **解决方案**：制定并遵循命名约定
  ```typescript
  // 表名使用小写复数形式
  const usersSchema: TableSchema = {
    name: 'users', // 正确：复数形式
    // ...
  };
  
  // 字段名使用驼峰命名法
  const userSchema: TableSchema = {
    // ...
    columns: [
      // ...
      {
        name: 'lastActive', // 正确：驼峰命名法
        type: 'date',
        // ...
      },
      // ...
    ]
  };
  ```
- **最佳实践**：
  - 表名使用小写复数形式（如`users`、`matches`）
  - 字段名使用驼峰命名法（如`firstName`、`lastActive`）
  - 外键名使用关联表的单数形式加上`Id`（如`userId`）
  - 索引名使用`idx_表名_字段名`格式（如`idx_users_email`）
  - 在整个项目中保持命名一致性

遵循这些经验教训，可以建立结构清晰、一致和高性能的数据库表结构，为应用程序提供稳固的数据基础。

## 离线存储标记

### 概述

离线存储标记（`offlineOnly`）是一个特殊的同步配置标志，用于标记某些表或模型仅在本地设备上存储，不会同步到云端服务器。这对于存储用户的私人数据、临时草稿、设备特定设置等场景非常有用。

### 使用方法

要将表标记为离线存储，需要在表的 `syncConfig` 配置中添加 `offlineOnly: true` 属性：

```typescript
import { schemaRegistry, TableSchema } from '../index';
import { SyncPriority, ConflictResolution } from '@/core/lib/db/types/sync-flags';

const offlineDataSchema: TableSchema = {
  name: 'offline_data',
  syncConfig: {
    enabled: true, // 仍然需要设置启用同步
    offlineOnly: true, // 关键属性：标记为仅离线存储
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    // ...列定义
  ]
};

// 注册表结构
schemaRegistry.register(offlineDataSchema);
```

### 工作原理

当表被标记为 `offlineOnly: true` 时：

1. 同步管理器（SyncManager）会自动跳过对该表数据的同步处理
2. 即使在在线环境中，该表的数据也不会被发送到服务器
3. 在多设备环境中，每个设备将有其自己的离线数据副本，彼此之间不会同步

### 应用场景

- **个人笔记和草稿**：用户不希望同步到云端的私人笔记
- **设备偏好设置**：特定于当前设备的应用配置
- **临时缓存数据**：暂存的表单数据或编辑状态
- **敏感信息**：用户不希望存储在服务器上的敏感数据
- **本地存储的媒体文件引用**：指向设备上媒体文件的路径信息

### 注意事项

1. 被标记为离线存储的数据无法在多设备间共享
2. 如果用户更换设备或重装应用，离线数据将会丢失（除非实现备份机制）
3. 虽然数据不会发送到服务器，但开发者仍应注意数据安全，可能需要应用本地加密