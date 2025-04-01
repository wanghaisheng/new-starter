# 数据模型（Models）模块化实现指南

## 1. 数据模型概述

数据模型是应用程序中的核心组件，它们封装了业务实体的数据结构和行为。在本项目中，我们采用模块化设计，**每个实体对应一个独立的模型类文件**，以提高代码的可维护性和可扩展性。模型类实现了对应的实体接口，并提供了数据验证、转换和业务逻辑方法。

### 1.1 设计理念

- **模块化**：每个实体一个文件，便于维护和扩展
- **类型安全**：利用TypeScript接口确保类型安全
- **数据验证**：在构造函数中进行数据验证和类型转换
- **业务逻辑**：封装与实体相关的业务逻辑方法
- **数据转换**：提供与数据库记录之间的转换方法

### 1.2 核心组件

- **实体模型类**：实现对应实体接口的具体类，每个实体对应一个独立的文件
- **类型定义**：来自`types`目录的实体接口定义
- **导出文件**：`index.ts`集中导出所有模型类，方便其他模块引用

## 2. 目录结构

```
./
├── README.md           # 本文档
├── index.ts            # 导出文件
├── user.ts             # 用户模型
├── match.ts            # 匹配模型
├── message.ts          # 消息模型
└── [entity-name].ts    # 其他实体模型
```

## 3. 模型类实现指南

### 3.1 创建新的模型类

创建新的模型类时，应遵循以下步骤：

1. 在`types`目录中定义实体接口（如果尚未定义）
2. 在`models`目录中创建新的模型类文件，命名为`[entity-name].ts`
3. 实现模型类，包括构造函数、数据验证和转换方法
4. 在`index.ts`中导出新模型类

### 3.2 模型类模板

```typescript
import { BaseEntity } from '../types/base-entity';
import { YourEntity } from '../types/your-entity';

/**
 * YourEntity模型类
 * 实现YourEntity的数据模型
 */
export class YourEntityModel implements YourEntity, BaseEntity {
  id: string;
  // 其他属性...
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<YourEntityModel>) {
    Object.assign(this, data);
    
    // 确保日期字段是Date类型
    if (data.createdAt && !(data.createdAt instanceof Date)) {
      this.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && !(data.updatedAt instanceof Date)) {
      this.updatedAt = new Date(data.updatedAt);
    }
    
    // 设置默认值
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
    
    // 其他数据验证和转换...
  }

  /**
   * 转换为数据库记录
   */
  toRecord() {
    return {
      ...this,
      // 特殊字段转换
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建实体对象
   */
  static fromRecord(record: any): YourEntityModel {
    return new YourEntityModel({
      ...record,
      // 特殊字段转换
    });
  }

  /**
   * 业务逻辑方法
   */
  someBusinessMethod() {
    // 实现业务逻辑
  }
}
```

## 4. 最佳实践

### 4.1 命名规范

- 模型类文件名使用小写，单数形式，如`user.ts`、`match.ts`
- 模型类名使用大驼峰命名法，如`User`、`Match`
- 如果模型类名与类型接口名相同，可以直接使用接口名，如`User`
- 如果需要区分，可以在模型类名后添加`Model`后缀，如`UserModel`

### 4.2 数据验证

- 在构造函数中进行数据验证和类型转换
- 对必填字段进行非空检查
- 对日期字段进行类型转换
- 对数组和对象字段设置默认空值
- 对枚举字段进行有效值检查

### 4.3 数据转换

- 实现`toRecord`方法，将模型对象转换为数据库记录
- 实现静态`fromRecord`方法，将数据库记录转换为模型对象
- 处理特殊字段的序列化和反序列化，如日期、JSON对象等

### 4.4 业务逻辑

- 在模型类中实现与实体相关的业务逻辑方法
- 保持方法的单一职责
- 避免在模型类中直接依赖数据库操作

## 5. 与其他模块的关系

### 5.1 与Types模块的关系

- 模型类实现`types`目录中定义的实体接口
- 模型类可以扩展接口，添加额外的方法和属性
- 模型类负责数据验证和转换，而接口只定义数据结构

### 5.2 与Repositories模块的关系

- 仓储类使用模型类进行数据操作
- 仓储类负责数据持久化，而模型类负责业务逻辑
- 仓储类返回模型类实例，而不是原始数据库记录

### 5.3 与Schema模块的关系

- 模型类的结构应与Schema定义保持一致
- Schema定义了数据库表结构，而模型类定义了业务实体
- 模型类的`toRecord`和`fromRecord`方法应考虑Schema的字段定义

## 6. 示例

### 6.1 User模型

```typescript
import { BaseEntity } from '../types/base-entity';
import { User as UserType } from '../types/user';

export class User implements UserType, BaseEntity {
  // 属性实现...
  
  constructor(data: Partial<User>) {
    // 数据验证和转换...
  }
  
  toRecord() {
    // 转换为数据库记录...
  }
  
  static fromRecord(record: any): User {
    // 从数据库记录创建用户对象...
  }
  
  // 业务逻辑方法...
}
```

### 6.2 导出文件

```typescript
/**
 * 数据模型导出文件
 * 集中导出所有数据模型，方便其他模块引用
 */

export * from './user';
export * from './match';
export * from './message';
// 导出其他模型...
```