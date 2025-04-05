# 避免开发中的Linter错误指南

本文档提供了避免项目开发过程中常见linter错误的最佳实践和技巧，帮助开发者编写高质量、一致的代码。

## 目录

1. [TypeScript类型错误](#typescript类型错误)
2. [异步代码处理](#异步代码处理)
3. [导入路径规范](#导入路径规范)
4. [类继承与接口实现](#类继承与接口实现)
5. [泛型使用最佳实践](#泛型使用最佳实践)
6. [常见修复模式](#常见修复模式)
7. [代码提交前检查](#代码提交前检查)

## TypeScript类型错误

### 常见的类型错误

1. **类型不兼容**

   ```typescript
   // 错误示例
   const user: User = { name: 'John' }; // 缺少User所需的其他属性
   
   // 正确示例
   const user: User = { 
     id: '1',
     name: 'John',
     email: 'john@example.com',
     createdAt: new Date(),
     updatedAt: new Date()
   };
   ```

2. **泛型约束冲突**

   ```typescript
   // 错误示例
   async findById<T extends BaseEntity>(id: string): Promise<T> {
     const result = await this.query(id);
     return result; // 错误: 'BaseEntity' 不能赋值给 'T'
   }
   
   // 正确示例
   async findById<T extends BaseEntity>(id: string): Promise<T> {
     const result = await this.query(id);
     return result as T; // 使用类型断言
   }
   ```

3. **null/undefined 处理**

   ```typescript
   // 错误示例
   function getUsername(user: User | null): string {
     return user.name; // 错误: 'user'可能为'null'
   }
   
   // 正确示例
   function getUsername(user: User | null): string {
     return user?.name ?? 'Guest'; // 使用可选链和空值合并
   }
   ```

### 泛型参数使用建议

1. **明确泛型参数的约束**

   ```typescript
   // 推荐
   function findAll<T extends BaseEntity>(filter?: Filter<T>): Promise<T[]> {
     // 实现...
   }
   
   // 不推荐
   function findAll<T>(filter?: any): Promise<T[]> {
     // 实现...
   }
   ```

2. **使用适当的类型断言**

   ```typescript
   // 适当的类型断言
   const result = await this.client.findById(tableName, id);
   return result as T | null;
   ```

3. **使用类型保护**

   ```typescript
   function isUser(obj: any): obj is User {
     return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj;
   }
   
   if (isUser(data)) {
     // 此代码块中，TypeScript知道data是User类型
     console.log(data.name);
   }
   ```

## 异步代码处理

### Promise与async/await

1. **保持一致的返回类型**

   ```typescript
   // 错误示例
   protected addToPendingSync(tableName: string, item: Entity): void {
     // 执行操作...
   }
   
   // 正确示例(如果基类要求返回Promise)
   protected async addToPendingSync(tableName: string, item: Entity): Promise<void> {
     // 执行操作...
   }
   ```

2. **总是await异步操作**

   ```typescript
   // 错误示例
   async updateUser(id: string, data: Partial<User>): Promise<void> {
     await this.repository.update(id, data);
     this.syncOperation(); // 错误: 未等待异步操作完成
   }
   
   // 正确示例
   async updateUser(id: string, data: Partial<User>): Promise<void> {
     await this.repository.update(id, data);
     await this.syncOperation();
   }
   ```

3. **处理Promise链中的错误**

   ```typescript
   // 推荐
   async function processData() {
     try {
       const data = await fetchData();
       return processResult(data);
     } catch (error) {
       console.error('处理数据时出错:', error);
       throw error; // 或者返回默认值
     }
   }
   ```

## 导入路径规范

遵循项目的[导入路径规范](./import-path-standards.md)可以避免路径相关的错误：

1. **使用@/前缀的绝对路径**

   ```typescript
   // 推荐
   import { User } from '@/core/lib/db/types';
   
   // 不推荐
   import { User } from '../../../types';
   ```

2. **避免循环依赖**

   ```typescript
   // 避免A模块导入B模块，而B模块又导入A模块
   // 可以通过重构代码、使用接口或将共享代码提取到单独模块来解决
   ```

3. **使用命名导入**

   ```typescript
   // 推荐
   import { UserService } from '@/services/user-service';
   
   // 不推荐(除非必要)
   import * as UserServices from '@/services/user-service';
   ```

## 类继承与接口实现

### 正确实现接口

1. **完整实现所有必需方法**

   ```typescript
   // 错误示例
   class UserService implements IUserService {
     // 缺少接口中定义的方法
   }
   
   // 正确示例
   class UserService implements IUserService {
     async getUser(id: string): Promise<User | null> {
       // 实现...
     }
     
     async updateUser(id: string, data: Partial<User>): Promise<void> {
       // 实现...
     }
     
     // 实现接口中的所有方法
   }
   ```

2. **保持方法签名一致**

   ```typescript
   // 基类
   abstract class BaseClient {
     protected abstract addToPendingSync(collection: string, item: any): Promise<void>;
   }
   
   // 正确的子类实现
   class HybridClient extends BaseClient {
     protected async addToPendingSync(collection: string, item: any): Promise<void> {
       // 实现...
     }
   }
   
   // 错误的子类实现
   class WrongClient extends BaseClient {
     protected addToPendingSync(collection: string, item: any): void { // 错误：返回类型不匹配
       // 实现...
     }
   }
   ```

### 泛型继承

1. **保持泛型约束一致**

   ```typescript
   // 基类
   abstract class Repository<T extends BaseEntity> {
     abstract findById(id: string): Promise<T | null>;
   }
   
   // 正确的子类实现
   class UserRepository extends Repository<User> {
     async findById(id: string): Promise<User | null> {
       // 实现...
     }
   }
   ```

2. **处理方法覆盖中的泛型**

   ```typescript
   // 基类
   class BaseRepository<T extends BaseEntity> {
     async findAll(): Promise<T[]> {
       // 实现...
     }
   }
   
   // 子类
   class UserRepository extends BaseRepository<User> {
     async findAll(): Promise<User[]> {
       const results = await super.findAll();
       return results; // 这里的类型推断是正确的，因为T被绑定为User
     }
   }
   ```

## 泛型使用最佳实践

1. **谨慎使用类型参数**

   ```typescript
   // 方法本身已有泛型参数时，调用时通常不需要显式提供类型参数
   
   // 推荐
   const users = await repository.findAll();
   
   // 通常不必要(除非需要特定约束)
   const users = await repository.findAll<User>();
   ```

2. **处理多层泛型转换**

   ```typescript
   // 复杂泛型场景中可能需要多次类型转换
   async query<T extends BaseEntity>(options: QueryOptions): Promise<QueryResult<T>> {
     const result = await this.client.query(tableName, options);
     return {
       data: result.data as T[],
       total: result.total,
       hasMore: result.hasMore
     };
   }
   ```

3. **使用类型收窄**

   ```typescript
   function process<T extends { type: string }>(item: T) {
     if (item.type === 'user') {
       // 在此代码块中，TypeScript知道item具有更具体的类型
       const user = item as T & { name: string };
       console.log(user.name);
     }
   }
   ```

## 常见修复模式

### 1. 类型断言模式

用于解决泛型类型不能直接赋值的情况：

```typescript
// 修复前
async findById<T extends BaseEntity>(id: string): Promise<T | null> {
  return this.client.findById(id); // 错误
}

// 修复后
async findById<T extends BaseEntity>(id: string): Promise<T | null> {
  const result = await this.client.findById(id);
  return result as T | null;
}
```

### 2. Promise一致性模式

确保方法返回类型符合基类或接口要求：

```typescript
// 修复前
protected addToPendingSync(tableName: string, item: EntityWithId): void {
  // 实现...
}

// 修复后
protected async addToPendingSync(tableName: string, item: EntityWithId): Promise<void> {
  // 相同的实现...
}
```

### 3. 方法调用更新模式

当方法签名变更时，更新所有调用点：

```typescript
// 修复前
this.addToPendingSync(tableName, item);

// 修复后(当方法变为异步)
await this.addToPendingSync(tableName, item);
```

### 4. 空值保护模式

```typescript
// 修复前
const data = result.data;
return data;

// 修复后
const data = result?.data ?? [];
return data;
```

## 代码提交前检查

在提交代码前，建议执行以下操作以避免常见错误：

1. **运行linter检查**
   ```bash
   npm run lint
   ```

2. **运行类型检查**
   ```bash
   npm run type-check
   ```

3. **检查实现继承类和接口的方法签名一致性**
   - 确保方法参数类型匹配
   - 确保返回类型匹配
   - 确保异步方法正确返回Promise

4. **检查泛型使用**
   - 确认泛型参数的约束适当
   - 确认返回类型使用了正确的类型转换

5. **检查Promise处理**
   - 确认所有异步调用都使用了await
   - 确认异步方法都正确返回Promise
   - 确认有适当的错误处理 