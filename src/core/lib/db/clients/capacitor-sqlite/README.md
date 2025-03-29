# Capacitor SQLite Client

这是一个基于 Capacitor SQLite 插件的数据库客户端实现，用于在移动应用中提供本地数据存储功能。

## 功能特性

- 完整的 CRUD 操作支持
- 批量操作支持
- 事务支持
- 查询优化
- 错误处理
- 类型安全

## 安装

```bash
npm install @capacitor-community/sqlite
```

## 使用方法

### 初始化

```typescript
import { SQLiteClient } from './sqlite-client';

const client = new SQLiteClient({
  name: 'app-db',
  version: 1
});

// 初始化数据库
await client.initialize();
```

### 基本操作

```typescript
// 创建记录
const user = await client.create('users', {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
});

// 查询记录
const found = await client.findById('users', '1');

// 更新记录
await client.update('users', '1', {
  name: 'Jane Doe'
});

// 删除记录
await client.delete('users', '1');
```

### 查询操作

```typescript
// 基本查询
const results = await client.findAll('users', { age: 25 });

// 高级查询
const queryResults = await client.query('users', {
  where: { age: { $gt: 25 } },
  orderBy: ['name', 'ASC'],
  limit: 10,
  offset: 0
});
```

### 批量操作

```typescript
const operations = [
  {
    type: 'add',
    data: {
      id: '1',
      name: 'User 1',
      email: 'user1@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    type: 'put',
    data: {
      id: '2',
      name: 'Updated User 2',
      email: 'user2@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    type: 'delete',
    data: {
      id: '3',
      name: 'User 3',
      email: 'user3@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

await client.batch('users', operations);
```

### 事务支持

```typescript
await client.transaction(async (tx) => {
  await client.create('users', {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await client.create('profiles', {
    id: '1',
    userId: '1',
    bio: 'Hello World',
    createdAt: new Date(),
    updatedAt: new Date()
  });
});
```

## 性能优化

### 批量操作
使用批量操作而不是单条操作可以提高性能：

```typescript
// 推荐
await client.batch('users', operations);

// 不推荐
for (const operation of operations) {
  await client.create('users', operation.data);
}
```

### 查询优化
使用适当的索引和查询条件可以提高查询性能：

```typescript
// 推荐：使用索引字段
await client.query('users', {
  where: { email: 'user@example.com' }
});

// 推荐：使用 LIMIT
await client.query('users', {
  limit: 20
});

// 不推荐：查询所有记录
const allUsers = await client.findAll('users');
```

## 错误处理

```typescript
try {
  await client.create('users', userData);
} catch (error) {
  console.error('Failed to create user:', error);
  // 处理错误
}
```

## 注意事项

1. 数据库初始化
   - 在使用客户端之前必须调用 `initialize()`
   - 初始化失败会抛出异常

2. 资源管理
   - 使用完毕后调用 `close()` 释放资源
   - 在应用退出时确保关闭数据库连接

3. 事务处理
   - 事务中的操作要么全部成功，要么全部失败
   - 事务失败时会自动回滚

4. 数据类型
   - 日期类型会被自动转换为 ISO 字符串存储
   - 查询时会自动转换回 Date 对象
   - JSON 数组会被自动序列化和反序列化

## 最佳实践

1. 数据库设计
   - 使用合适的字段类型
   - 添加必要的索引
   - 设计合理的表结构

2. 性能优化
   - 使用批量操作
   - 合理使用索引
   - 避免大量数据查询

3. 错误处理
   - 始终使用 try-catch 处理异常
   - 记录错误日志
   - 实现适当的错误恢复机制

4. 数据一致性
   - 使用事务确保数据一致性
   - 实现数据验证
   - 定期备份数据

## 常见问题

1. 数据库连接失败
   - 检查数据库名称和版本
   - 确保有足够的存储空间
   - 验证数据库权限

2. 查询性能问题
   - 检查索引使用情况
   - 优化查询条件
   - 考虑使用缓存

3. 内存使用问题
   - 避免一次性加载大量数据
   - 使用分页查询
   - 及时释放不需要的资源

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT 