# 仓储类型定义最佳实践

本目录用于存放所有实体仓储接口的类型定义，旨在实现：
- 统一的 CRUD 操作接口
- 领域专属扩展方法的灵活定义
- 代码可维护性与类型安全的最佳平衡

## 设计原则

### 1. 基础仓储接口（IBaseRepository<T>）
- 所有实体仓储接口均应继承自 `IBaseRepository<T>`。
- 通用 CRUD 方法（findById、findAll、create、update、delete）全部在基类定义。
- 支持分页、批量操作、通用 query 等常见扩展。

### 2. 领域专属接口扩展
- 仅在子接口中扩展**领域特有**的方法（如 findByEmail、findByPhone）。
- 不要重复定义已在 `IBaseRepository` 中声明的通用方法，避免冗余和实现重复。
- 实现类只需实现差异化方法，维护更高效。

### 3. 类型签名规范
- 所有方法均应返回 Promise，明确类型参数。
- filter 参数建议用 Partial<T>，options 支持 limit/offset/orderBy。
- 支持可选的批量操作方法（如 createMany、updateMany、deleteMany）。

## 示例

### base-repository.types.ts
```typescript
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  createMany?(entities: T[]): Promise<T[]>;
  updateMany?(ids: string[], updates: Partial<T>): Promise<number>;
  deleteMany?(ids: string[]): Promise<number>;
  query?(filter?: Partial<T>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<T[]>;
}
```

### user-repository.types.ts
```typescript
import { User } from '@/core/lib/db/types/user.types';
import { IBaseRepository } from './base-repository.types';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  // 可扩展更多用户专属方法
}
```

## 推荐实践
- **只在子接口扩展业务特有方法**，其余通用操作全部继承自 IBaseRepository。
- 避免在子接口重复定义 create、update、delete、findById 等 CRUD 方法。
- 新增实体仓储时，先继承 IBaseRepository，再按业务需求扩展专属方法。

---

如需扩展其它仓储类型接口，建议参考本目录结构和接口风格，保持一致性和可维护性。