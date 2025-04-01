# 数据库类型定义指南

本文档详细说明了如何在项目中新增数据库表类型定义，包括类型定义的标准格式、命名规范以及如何与表结构定义关联。本指南旨在确保项目中的数据库类型定义保持一致性和可维护性。

## 1. 类型定义概述

在本项目中，数据库类型定义主要包括以下几个部分：

1. **基础实体类型**：所有数据库实体都应继承的基本类型（`BaseEntity`），包含通用字段如`id`、`createdAt`和`updatedAt`
2. **领域实体类型**：特定业务领域的实体类型定义（如用户、匹配、消息等），用于表示业务数据模型
3. **数据库操作类型**：与数据库操作相关的类型定义（如查询选项、事务、批处理等），用于规范数据库操作接口
4. **类型转换工具**：用于实体与数据库记录之间的转换，包括日期格式化、数据序列化和反序列化等

## 2. 类型定义文件组织

类型定义文件按照功能和领域进行组织，遵循关注点分离原则：

- `base-entity.ts`：定义基础实体类型（如`BaseEntity`、`DatabaseRecord`）和通用类型转换工具（如`CreateEntityData`、`UpdateEntityData`、`WithTimestamps`）
- `database.types.ts`：定义数据库操作相关的类型，包括数据库引擎类型、配置接口、查询选项、事务接口等
- `user.ts`：定义用户相关的实体类型（如`User`、`UserPreferences`等）
- `location.ts`：定义位置相关的类型（如`Location`）
- `photo.ts`：定义照片相关的实体类型（如`Photo`）
- `match.ts`：定义匹配相关的实体类型（如`Match`、`MatchAction`等）
- `message.ts`：定义消息相关的实体类型（如`Message`）
- `interaction.ts`：定义用户互动相关的实体类型（如`Report`、`Block`等）
- `repository.ts`：定义仓库接口（如`IDatingRepository`）
- `simulator.ts`：定义模拟器相关的类型，用于测试和性能评估（如`NetworkConditions`、`ResourceMetrics`、`BatchOperation`等）
- `index.ts`：导出所有类型，提供统一的类型访问入口，解决命名冲突问题，并提供`getSchemaType`工具函数

## 3. 新增表类型的步骤

### 3.1 定义实体接口

在 `src/core/lib/db/types/` 目录下创建新的类型定义文件（如 `new-entity.ts`）：

```typescript
// 在新创建的类型文件中（如 new-entity.ts）
import { BaseEntity } from './base-entity';

/**
 * 新实体接口
 * 简要描述该实体的用途
 */
export interface NewEntity extends BaseEntity {
  // 实体特有的属性
  property1: string;
  property2: number;
  property3?: boolean;
  // ...
}
```

### 3.2 创建表结构定义

在 `src/core/lib/db/schema/definitions/` 目录下创建或修改表结构定义文件：

```typescript
import { schemaRegistry, TableSchema } from '../index';

// 新表结构定义
const newEntitySchema: TableSchema = {
  name: 'new_entities', // 表名使用小写复数形式
  columns: [
    { name: 'id', type: 'string', primaryKey: true, notNull: true },
    { name: 'property1', type: 'string', notNull: true },
    { name: 'property2', type: 'number', notNull: true },
    { name: 'property3', type: 'boolean' },
    { name: 'createdAt', type: 'date', notNull: true },
    { name: 'updatedAt', type: 'date', notNull: true }
  ],
  indexes: [
    { name: 'idx_new_entities_property1', columns: ['property1'] }
  ]
};

// 注册表结构
schemaRegistry.register(newEntitySchema);

// 导出表结构
export default newEntitySchema;
```

### 3.3 更新类型导出

确保在 `index.ts` 文件中导出新定义的类型：

```typescript
// 在 index.ts 中添加
export * from './your-domain-file'; // 如果是新文件
```

## 4. 类型定义规范

### 4.1 命名规范

- **接口名称**：使用PascalCase命名法，如`User`、`Match`、`Message`
- **属性名称**：使用camelCase命名法，如`firstName`、`createdAt`、`isActive`
- **文件名称**：使用kebab-case命名法，如`base-entity.ts`、`database.types.ts`
- **类型别名**：使用PascalCase命名法，并根据用途添加适当后缀，如`CreateEntityData`、`UpdateEntityData`
- **枚举类型**：使用PascalCase命名法，如`SyncStrategy`、`DatabaseEngine`
- **联合类型**：使用描述性名称，如`ColumnType`、`SyncStatus`

### 4.2 类型定义示例

以下是一个完整的实体类型定义示例：

```typescript
import { BaseEntity } from './base-entity';

/**
 * 用户实体接口
 * 表示系统中的用户信息
 */
export interface User extends BaseEntity {
  // 基本信息
  name: string;
  email: string;
  phone?: string;
  
  // 个人资料
  photoUrl?: string;
  bio?: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  interests: string[];
  
  // 位置信息
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  
  // 状态信息
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}
```

## 5. 与SchemaRegistry的集成

类型定义与表结构定义之间通过`getSchemaType`函数进行关联，该函数在`index.ts`中定义。这种关联确保了类型定义与数据库表结构的一致性，并提供了类型安全的数据访问方式。

```typescript
/**
 * 获取表结构对应的类型定义
 * @param tableName 表名
 * @returns 表对应的类型定义（仅用于类型推断）
 */
export const getSchemaType = <T extends BaseEntity>(tableName: string): T => {
  const schema = schemaRegistry.getSchema(tableName);
  if (!schema) {
    throw new Error(`Schema not found for table: ${tableName}`);
  }
  return {} as T; // 这只是用于类型推断，实际数据来自数据库
};
```

使用示例：

```typescript
import { User, Match, Message, getSchemaType } from '../types';

// 获取用户表的类型定义
const userType = getSchemaType<User>('users');

// 在仓库层使用类型定义
class UserRepository {
  async findById(id: string): Promise<User | null> {
    // 实现查询逻辑
    // 返回的数据会被自动推断为User类型
  }
  
  async create(data: CreateEntityData<User>): Promise<User> {
    // 实现创建逻辑
    // 参数data会被自动检查是否符合User类型（除了id和时间戳字段）
  }
}
```

## 6. 最佳实践

1. **保持类型与表结构一致**：确保实体类型定义与表结构定义保持一致，包括字段名称、类型和约束
2. **使用类型扩展**：利用TypeScript的类型系统，使用类型扩展和工具类型简化类型定义
3. **避免重复定义**：不要在多个文件中重复定义相同的类型，应通过导入复用已有类型
4. **使用注释**：为复杂类型添加JSDoc注释，说明类型的用途和约束
5. **保持类型的纯净**：类型定义应该只包含类型信息，不应包含实现逻辑

## 7. 类型与模型的关系

类型定义（Interface）与模型类（Class）的区别：

- **类型定义**：描述数据结构，用于类型检查，在编译时使用
- **模型类**：包含业务逻辑和行为，在运行时使用

在本项目中，我们优先使用类型定义，只在需要添加业务逻辑时才创建模型类。

## 8. Lessons Learned From Consistency Fixes

在数据库一致性修复任务中，我们总结了以下关于类型定义的关键经验教训：

### 8.1 类型定义与模型实现的一致性

- **问题**：类型定义和模型实现不一致导致编译错误和运行时问题
- **解决方案**：确保类型定义和模型实现保持同步
  ```typescript
  // 类型定义（types/message.ts）
  export interface Message extends BaseEntity {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image'; // 确保模型使用相同的字段名和类型
    status: 'sent' | 'delivered' | 'read';
  }
  
  // 模型实现（models/message.ts）
  export class Message implements MessageType, BaseEntity {
    id: string;
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: 'text' | 'image'; // 与类型定义保持一致
    status: 'sent' | 'delivered' | 'read';
    createdAt: Date;
    updatedAt: Date;
    // ...
  }
  ```
- **最佳实践**：
  - 优先定义类型接口，然后实现模型类
  - 在修改类型定义时同步更新相关的模型实现
  - 使用TypeScript的`implements`关键字强制类型检查
  - 定期审查类型定义和模型实现的一致性

### 8.2 字段命名标准化

- **问题**：不一致的字段命名导致混淆和错误（如`contentType`vs`type`）
- **解决方案**：制定并遵循命名约定
  ```typescript
  // 不一致的命名
  export interface OldMessage {
    contentType: string; // 一个接口使用contentType
  }
  
  export interface NewMessage {
    type: string; // 另一个接口使用type表示相同的概念
  }
  
  // 统一后的命名
  export interface Message {
    type: string; // 所有接口都使用type
  }
  ```
- **最佳实践**：
  - 为相同概念使用相同的字段名
  - 使用语义明确的名称
  - 遵循项目的命名规范（如驼峰命名法）
  - 在整个代码库中保持一致性

### 8.3 创建和更新操作的辅助类型

- **问题**：缺少专用的创建和更新类型导致类型不安全
- **解决方案**：定义专用的创建和更新类型
  ```typescript
  // 实体接口
  export interface User extends BaseEntity {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // 创建数据类型
  export interface CreateUserData {
    name: string;
    email: string;
    isVerified?: boolean; // 可选，有默认值
  }
  
  // 更新数据类型
  export interface UpdateUserData {
    name?: string;
    email?: string;
    isVerified?: boolean;
  }
  ```
- **最佳实践**：
  - 为每个实体定义`CreateXxxData`和`UpdateXxxData`接口
  - 创建类型应包含所有必填字段，但排除自动生成的字段（如`id`和时间戳）
  - 更新类型应将所有字段设为可选
  - 使用辅助类型简化定义：`CreateEntityData<T>`和`UpdateEntityData<T>`

### 8.4 类型转换工具的重要性

- **问题**：缺少类型转换工具导致重复代码和错误处理
- **解决方案**：实现统一的类型转换工具
  ```typescript
  // 类型转换工具（converters.ts）
  export function toRecord<T extends BaseEntity>(entity: T): DatabaseRecord {
    // 通用转换逻辑
  }
  
  export function userToRecord(user: User): DatabaseRecord {
    // 用户特定的转换逻辑
  }
  
  export function recordToUser(record: DatabaseRecord): User {
    // 将数据库记录转换为用户对象
  }
  ```
- **最佳实践**：
  - 实现通用的`toRecord`和`fromRecord`函数
  - 为复杂实体实现特定的转换函数
  - 确保转换函数处理所有特殊类型（如日期、JSON对象）
  - 添加类型安全检查以避免运行时错误

### 8.5 完整的JSDoc文档

- **问题**：类型定义文档不完整导致使用困难
- **解决方案**：为所有类型添加完整的JSDoc注释
  ```typescript
  /**
   * 用户偏好设置接口
   * 定义用户的匹配偏好
   * 
   * @description
   * 表示用户在匹配过程中的偏好设置，包括年龄范围、距离限制等
   */
  export interface UserPreferences {
    /** 
     * 年龄范围偏好 
     * @property min 最小年龄
     * @property max 最大年龄
     */
    ageRange: {
      min: number;
      max: number;
    };
    
    /** 最大距离（公里） */
    distance: number;
    
    /** 性别偏好 */
    gender: ('male' | 'female' | 'other')[];
  }
  ```
- **最佳实践**：
  - 为每个接口添加简介和详细描述
  - 为复杂或不明显的属性添加说明
  - 使用`@property`标记描述嵌套属性
  - 记录枚举值和联合类型的可能取值
  - 保持注释与实现的同步更新

### 8.6 类型导出与命名冲突解决

- **问题**：类型导出中的命名冲突导致混淆和错误
- **解决方案**：使用命名空间和重命名导出
  ```typescript
  // 避免命名冲突
  import { BatchOperation as DBBatchOperation } from './database.types';
  import { BatchOperation as SimBatchOperation } from './simulator';
  
  // 命名空间导出
  import * as DatabaseTypes from './database.types';
  import * as SimulatorTypes from './simulator';
  
  export { DatabaseTypes, SimulatorTypes };
  
  // 重命名导出
  export type { 
    DBBatchOperation as DatabaseBatchOperation, 
    SimBatchOperation as SimulatorBatchOperation 
  };
  ```
- **最佳实践**：
  - 使用命名空间组织相关类型
  - 在导出时重命名冲突的类型
  - 使用类型别名创建有意义的名称
  - 在index.ts中集中管理导出，解决潜在冲突

遵循这些经验教训，可以建立类型安全、一致且易于维护的类型系统，提高开发效率并减少运行时错误。