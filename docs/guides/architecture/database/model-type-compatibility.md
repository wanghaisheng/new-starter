# 模型、类型与服务兼容性指南

本文档提供了在项目中确保模型、类型和服务之间兼容性的最佳实践和常见问题解决方案。

## 概述

在我们的应用架构中，数据流经过多个层次：

```
UI组件层 → 服务层 → 数据访问层 → 存储层
```

为确保类型安全，需要在这些层之间保持一致的类型定义和使用方式。

## 类型定义结构

项目中存在两套相关但不完全相同的类型定义：

1. **接口定义 (`src/core/lib/db/types/`)**: 
   - 定义实体的基本结构和属性
   - 不包含实例方法
   - 主要用于服务层和组件层

2. **模型类 (`src/core/lib/db/models/`)**: 
   - 实现相应的接口
   - 包含实例方法如 `toRecord()`
   - 主要用于数据层内部

## 常见问题及解决方案

### 1. 导入不一致导致的类型错误

**问题**: UI组件导入了模型类 (`models/`) 而非接口类型 (`types/`)，但服务返回的是接口类型对象。

```typescript
// 错误做法
import { User } from '@/core/lib/db/models/user';  // 导入类
const [user, setUser] = useState<User | null>(null);  // 期望使用具有toRecord()方法的类

// 正确做法
import { User } from '@/core/lib/db/types/user';  // 导入接口
const [user, setUser] = useState<User | null>(null);  // 使用不需要toRecord()方法的接口
```

**解决方案**: 
- UI组件应统一导入 `types/` 目录下的接口定义
- 服务层方法返回的是符合接口定义的普通对象，而非模型类实例

### 2. 日期类型处理不兼容

**问题**: 在不同环境中，日期可能以 `Date` 对象或 `string` 形式出现。

```typescript
// 有问题的代码
const formatTime = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp));
};

// 兼容的代码
const formatTime = (timestamp: Date | string): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return formatDistanceToNow(date);
};
```

**解决方案**: 
- 时间处理函数应接受 `Date | string` 类型
- 使用 `instanceof` 检查并进行适当的类型转换

### 3. 属性不一致问题

**问题**: 代码中使用了 `isRead` 属性，但 `Message` 接口中只定义了 `status` 枚举。

```typescript
// 错误
if (message.isRead) { /* ... */ }

// 正确
if (message.status === 'read') { /* ... */ }
```

**解决方案**:
- 检查接口定义，使用正确的属性和枚举值
- 避免使用未在接口中定义的属性

### 4. Repository 查询结果处理

**问题**: Repository 的 `query` 方法返回 `QueryResult<T>` 类型（带有 `data`、`total`、`hasMore` 属性的对象），但许多衍生查询方法直接返回这个结果，而不是提取 `data` 数组，导致与方法签名期望的返回类型不匹配。

```typescript
// 错误的实现（返回类型不兼容）
async findByReporterId(reporterId: string): Promise<Report[]> {
  return await this.query({
    where: { reporterId }
  }); // 这里返回的是 QueryResult<Report>，而非 Promise<Report[]>
}

// 正确的实现
async findByReporterId(reporterId: string): Promise<Report[]> {
  const result = await this.query({
    where: { reporterId }
  });
  return result.data; // 正确提取 data 属性返回 Report[]
}
```

**解决方案**:
- 确保所有衍生查询方法都从 `QueryResult<T>` 中提取 `data` 属性
- 对于返回单个对象的方法，检查 `data.length > 0` 并返回第一个元素
- 对于需要检查数组长度的方法，使用 `result.data.length` 而非直接检查结果长度

## 最佳实践

### 导入规范

1. **UI组件层**: 
   - 导入接口: `import { User } from '@/core/lib/db/types/user';`
   - 不要直接导入模型类

2. **服务层**: 
   - 导入接口: `import { User } from '@/core/lib/db/types/user';`
   - 返回符合接口的对象，而非模型类实例

3. **数据层内部**:
   - 可以使用模型类: `import { User } from '@/core/lib/db/models/user';`
   - 内部转换为接口兼容的对象返回给服务层

### 类型安全

1. **避免类型断言**: 尽量不使用 `as User` 等类型断言，而是使用正确的类型定义
2. **使用可选链**: 访问可能不存在的属性时使用可选链，如 `user?.photos?.[0]?.url`
3. **默认值处理**: 使用合并运算符设置默认值，如 `message.content || '无内容'`

### 日期处理

1. **统一日期处理函数**: 创建可接受多种日期格式的工具函数
2. **ISO格式转换**: 跨层传递时，考虑使用ISO字符串而非Date对象
3. **日期检验**: 接收外部日期时进行有效性检查

### 组件接口设计

1. **明确属性需求**: 在组件的props接口中明确所需的属性和类型
2. **隔离内部状态**: 避免直接在UI中使用数据层的类型定义
3. **属性映射**: 必要时进行属性映射或转换，确保兼容性

## 类型定义管理

### 创建辅助类型

对于需要在不同层之间传递的复杂对象，可以创建辅助类型：

```typescript
// 用于UI组件的用户视图模型
export type UserViewModel = {
  id: string;
  name: string;
  avatar: string;
  // UI特定属性
  isOnline?: boolean; 
  unreadCount?: number;
};

// 类型转换函数
export function toUserViewModel(user: User): UserViewModel {
  return {
    id: user.id,
    name: user.name,
    avatar: user.photos?.[0]?.url || '/assets/images/default-avatar.png',
    // 添加UI特定属性
  };
}
```

### 类型检查工具

在复杂项目中，可以创建类型检查工具：

```typescript
// 类型守卫函数
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string';
}

// 使用示例
if (isUser(data)) {
  // TypeScript现在知道data是User类型
  console.log(data.name);
}
```

## 总结

确保模型、类型和服务之间的兼容性对于维护类型安全和减少运行时错误至关重要。遵循上述最佳实践可以帮助避免常见的类型错误，并提高代码的可维护性和健壮性。

记住这个简单的规则：**UI组件应使用接口（`types/`），而非模型类（`models/`）**。这将避免大多数类型兼容性问题。 