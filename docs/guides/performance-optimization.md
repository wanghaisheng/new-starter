# 数据库性能优化指南

## 概述

本文档提供了数据库性能优化的详细指南，包括查询优化、缓存策略、批量操作优化等方面的最佳实践。

## 1. 查询优化

### 1.1 索引优化

#### 创建合适的索引
```typescript
// 创建单列索引
await client.executeRawQuery(
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'
);

// 创建复合索引
await client.executeRawQuery(
  'CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(user1Id, user2Id, status)'
);
```

#### 索引使用建议
1. 为经常查询的字段创建索引
2. 为外键字段创建索引
3. 为排序字段创建索引
4. 避免过度索引（会影响写入性能）

### 1.2 查询语句优化

#### 使用参数化查询
```typescript
// ✅ 推荐：使用参数化查询
const user = await client.findById<User>('users', userId);

// ❌ 不推荐：拼接 SQL 语句
const user = await client.executeRawQuery(
  `SELECT * FROM users WHERE id = '${userId}'`
);
```

#### 优化 SELECT 语句
```typescript
// ✅ 推荐：只选择需要的字段
const user = await client.executeRawQuery(
  'SELECT id, name, email FROM users WHERE id = ?',
  [userId]
);

// ❌ 不推荐：选择所有字段
const user = await client.executeRawQuery(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

## 2. 缓存策略

### 2.1 查询缓存

#### 实现查询缓存
```typescript
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) { // 默认 5 分钟
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

#### 使用缓存
```typescript
class SQLiteClient {
  private queryCache: QueryCache;

  constructor() {
    this.queryCache = new QueryCache();
  }

  async findById<T extends BaseEntity>(
    tableName: string,
    id: string,
    options: { useCache?: boolean } = {}
  ): Promise<T | null> {
    const cacheKey = `${tableName}:${id}`;
    
    if (options.useCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached) return cached as T;
    }

    const result = await this.executeRawQuery(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [id]
    );

    if (result && result.length > 0) {
      const entity = this.mapRowToEntity<T>(result[0]);
      if (options.useCache) {
        this.queryCache.set(cacheKey, entity);
      }
      return entity;
    }

    return null;
  }
}
```

### 2.2 缓存策略选择

1. **读多写少场景**
   - 使用较长的缓存时间
   - 实现缓存预热
   - 使用 LRU 缓存策略

2. **写多读少场景**
   - 使用较短的缓存时间
   - 实现缓存失效
   - 使用 FIFO 缓存策略

## 3. 批量操作优化

### 3.1 批量插入

#### 使用事务
```typescript
// ✅ 推荐：使用事务进行批量插入
await client.transaction(async () => {
  for (const user of users) {
    await client.createUser(user);
  }
});

// ✅ 推荐：使用单条 SQL 语句
await client.executeRawQuery(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  users.map(user => [user.name, user.email])
);
```

### 3.2 批量更新

#### 使用 IN 子句
```typescript
// ✅ 推荐：使用 IN 子句批量更新
await client.executeRawQuery(
  'UPDATE users SET status = ? WHERE id IN (?)',
  ['active', userIds]
);
```

## 4. 数据库维护

### 4.1 定期优化

#### 执行 VACUUM
```typescript
// 定期执行 VACUUM 优化数据库
await client.executeRawQuery('VACUUM');
```

#### 重建索引
```typescript
// 重建索引
await client.executeRawQuery('REINDEX');
```

### 4.2 监控和维护

#### 监控数据库大小
```typescript
// 监控数据库大小
const stats = await client.getStorageStats();
if (stats.totalSize > threshold) {
  await client.cleanupExpiredData();
}
```

#### 监控查询性能
```typescript
// 记录慢查询
const startTime = Date.now();
const result = await client.executeRawQuery(query, params);
const duration = Date.now() - startTime;

if (duration > slowQueryThreshold) {
  console.warn('Slow query detected:', {
    query,
    params,
    duration
  });
}
```

## 5. 性能测试

### 5.1 基准测试

```typescript
async function benchmarkQuery() {
  const iterations = 1000;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await client.findById<User>('users', userId);
    times.push(Date.now() - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.log('Query benchmark results:', {
    average: avg,
    max,
    min
  });
}
```

### 5.2 性能监控

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]>;

  constructor() {
    this.metrics = new Map();
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getStats(name: string): { avg: number; max: number; min: number } {
    const values = this.metrics.get(name) || [];
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values)
    };
  }
}
```

## 6. 最佳实践总结

1. **查询优化**
   - 使用合适的索引
   - 优化查询语句
   - 避免全表扫描

2. **缓存策略**
   - 根据场景选择合适的缓存策略
   - 合理设置缓存时间
   - 实现缓存失效机制

3. **批量操作**
   - 使用事务
   - 使用批量 SQL 语句
   - 避免频繁的单条操作

4. **数据库维护**
   - 定期执行 VACUUM
   - 监控数据库大小
   - 清理过期数据

5. **性能监控**
   - 实现性能基准测试
   - 监控慢查询
   - 记录性能指标

## 7. 常见性能问题及解决方案

1. **查询性能问题**
   - 问题：查询响应时间过长
   - 解决方案：
     - 添加合适的索引
     - 优化查询语句
     - 使用缓存

2. **内存使用问题**
   - 问题：内存占用过高
   - 解决方案：
     - 限制缓存大小
     - 实现 LRU 缓存
     - 定期清理缓存

3. **存储空间问题**
   - 问题：数据库文件过大
   - 解决方案：
     - 执行 VACUUM
     - 清理过期数据
     - 优化数据存储结构 