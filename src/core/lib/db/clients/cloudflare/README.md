# Cloudflare D1 数据库客户端

> 为 Cloudflare Workers 环境提供的 D1 数据库客户端实现

## 简介

Cloudflare D1 客户端是一个基于 `IDatabaseClient` 接口实现的数据库客户端，专为 Cloudflare Workers 环境中的 D1 数据库设计。它提供了统一的 API 来访问和操作 Cloudflare D1 数据库，并集成了 Drizzle ORM 以简化数据库操作。

D1 是 Cloudflare 提供的 SQLite 兼容的边缘数据库服务，可以直接在 Cloudflare Workers 环境中使用，为边缘应用提供可靠的数据存储能力。

## 功能特点

- 符合项目标准的数据库客户端接口实现
- 支持基本的 CRUD 操作（创建、读取、更新、删除）
- 集成 Drizzle ORM，提供类型安全的查询构建
- 支持 SQL 查询和事务处理
- 内置错误处理和日志记录
- 自动类型转换（例如日期字符串转 Date 对象）
- 批量操作支持

## 安装与配置

### 依赖项

确保你的项目中已安装以下依赖：

```bash
npm install drizzle-orm
```

### 配置

使用 `CloudflareD1Config` 接口配置客户端：

```typescript
import { CloudflareD1Client, CloudflareD1Config } from '@/core/lib/db/clients/cloudflare';

// 配置
const config: CloudflareD1Config = {
  name: 'my-database',
  version: 1,
  engine: 'cloudflare-d1',
  d1Instance: env.DB, // 从 Cloudflare Workers 环境中获取 D1 实例
  useDrizzle: true,   // 是否使用 Drizzle ORM (可选，默认为 true)
  enableQueryCache: true, // 是否启用查询缓存 (可选)
  queryCacheTTL: 60000,   // 缓存有效期，毫秒 (可选)
  tables: {
    // 数据库表配置
    users: {
      columns: {
        id: { type: 'text', constraints: ['PRIMARY KEY'] },
        name: { type: 'text' },
        email: { type: 'text' },
        createdAt: { type: 'timestamp' },
        updatedAt: { type: 'timestamp' }
      },
      indexes: {
        email_idx: { columns: ['email'], unique: true }
      }
    },
    // 其他表...
  }
};
```

## 使用示例

### 初始化客户端

```typescript
import { CloudflareD1Client } from '@/core/lib/db/clients/cloudflare';

// 在 Cloudflare Workers 环境中
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 创建并初始化客户端
    const client = new CloudflareD1Client({
      name: 'my-database',
      version: 1,
      engine: 'cloudflare-d1',
      d1Instance: env.DB
    });
    
    await client.initialize();
    
    // 使用客户端...
    
    return new Response('Hello World');
  }
};
```

### 基本 CRUD 操作

#### 创建记录

```typescript
// 创建用户
const newUser = await client.createUser({
  name: '张三',
  email: 'zhangsan@example.com'
});

console.log('创建的用户ID:', newUser.id);

// 通用创建方法
const newItem = await client.create('items', {
  name: '商品1',
  price: 99.99,
  inStock: true
});
```

#### 查询记录

```typescript
// 按ID查询
const user = await client.findById('users', 'user-123');

// 查询所有用户
const allUsers = await client.findUsers();

// 条件查询
const activeUsers = await client.findUsers({ isActive: true });

// 高级查询
const results = await client.query('users', {
  where: {
    field: 'age',
    operator: '>',
    value: 18
  },
  orderBy: {
    field: 'createdAt',
    direction: 'desc'
  },
  limit: 10,
  offset: 0
});

console.log(`共找到 ${results.total} 个结果`);
```

#### 更新记录

```typescript
// 更新用户
await client.updateUser('user-123', {
  name: '张三 (已更新)',
  isActive: false
});

// 通用更新方法
await client.update('items', 'item-456', {
  price: 79.99,
  inStock: false
});
```

#### 删除记录

```typescript
// 删除用户
await client.deleteUser('user-123');

// 通用删除方法
await client.delete('items', 'item-456');
```

### 事务处理

```typescript
// 使用事务
const result = await client.transaction(async (tx) => {
  // 在事务中执行多个操作
  const user = await tx.findById('users', 'user-123');
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const item = await tx.create('items', {
    name: '新商品',
    price: 199.99,
    userId: user.id
  });
  
  await tx.update('users', user.id, {
    itemCount: (user.itemCount || 0) + 1
  });
  
  return item;
});

// 事务成功完成，返回创建的商品
console.log('创建的商品:', result);
```

### 批量操作

```typescript
// 批量操作
await client.batch('users', [
  { type: 'add', data: { name: '用户1', email: 'user1@example.com' } },
  { type: 'add', data: { name: '用户2', email: 'user2@example.com' } },
  { type: 'put', data: { id: 'existing-user', name: '更新用户' } },
  { type: 'delete', data: { id: 'to-delete-user' } }
]);
```

### 原始 SQL 查询

```typescript
// 执行原始 SQL 查询
const results = await client.executeRawQuery(
  'SELECT * FROM users WHERE name LIKE ? AND age > ?',
  ['%张%', 25]
);
```

## API 参考

### 主要方法

| 方法                      | 描述                                      |
|--------------------------|------------------------------------------|
| `initialize()`           | 初始化数据库客户端                         |
| `close()`                | 关闭数据库连接                             |
| `clear()`                | 清空所有表                                |
| `findById(table, id)`    | 按 ID 查找记录                            |
| `findAll(table, filter)` | 查找所有符合条件的记录                     |
| `create(table, data)`    | 创建新记录                                |
| `update(table, id, data)`| 更新记录                                  |
| `delete(table, id)`      | 删除记录                                  |
| `query(table, options)`  | 使用高级查询选项查询记录                   |
| `count(table, filter)`   | 计算符合条件的记录数量                     |
| `beginTransaction()`     | 开始事务                                  |
| `commitTransaction()`    | 提交事务                                  |
| `rollbackTransaction()`  | 回滚事务                                  |
| `transaction(callback)`  | 执行事务回调                              |
| `batch(table, operations)`| 执行批量操作                             |
| `executeRawQuery(query, params)` | 执行原始 SQL 查询                 |

### 实体特定方法

| 方法                      | 描述                                      |
|--------------------------|------------------------------------------|
| `findUsers(query)`       | 查找用户                                  |
| `findMatches(query)`     | 查找匹配                                  |
| `findMessages(query)`    | 查找消息                                  |
| `createUser(data)`       | 创建用户                                  |
| `createMatch(data)`      | 创建匹配                                  |
| `createMessage(data)`    | 创建消息                                  |
| `updateUser(id, data)`   | 更新用户                                  |
| `updateMatch(id, data)`  | 更新匹配                                  |
| `updateMessage(id, data)`| 更新消息                                  |
| `deleteUser(id)`         | 删除用户                                  |
| `deleteMatch(id)`        | 删除匹配                                  |
| `deleteMessage(id)`      | 删除消息                                  |

## 注意事项和限制

1. **环境兼容性**: 只能在 Cloudflare Workers 环境或使用 Cloudflare Wrangler 开发工具的本地环境中使用。

2. **类型安全**: 使用 Drizzle ORM 时，请确保定义正确的表结构和类型信息，以充分利用类型安全特性。

3. **事务限制**: D1 支持事务，但有一些限制，例如事务中不能执行 DDL 语句（如 CREATE TABLE）。

4. **连接管理**: Cloudflare Workers 环境中的连接由 Cloudflare 管理，不需要手动关闭连接。

5. **边缘计算限制**: 请注意 Cloudflare Workers 的执行时间和内存限制，避免进行大规模数据操作。

6. **数据类型**: D1 基于 SQLite，支持 SQLite 的数据类型和特性，但可能有一些微小差异。

7. **ORM 兼容性**: 如果 Drizzle ORM 的类型系统导致编译错误，可以通过设置 `useDrizzle: false` 回退到原生 SQL 查询。

## 参与贡献

欢迎提交 Pull Request 或者提出 Issue 来帮助改进此客户端实现。请确保遵循项目的编码规范和贡献指南。

## 相关资源

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [SQLite 文档](https://www.sqlite.org/docs.html) 