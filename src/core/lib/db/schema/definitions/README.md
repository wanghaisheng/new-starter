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