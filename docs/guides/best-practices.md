# 数据库最佳实践指南

## 概述

本文档提供了数据库开发、测试和部署的最佳实践指南，帮助团队保持一致的开发标准和质量。

## 1. 开发阶段最佳实践

### 1.1 代码组织

#### 目录结构
```
src/core/lib/db/
├── clients/           # 数据库客户端实现
│   ├── capacitor-sqlite/  # SQLite 客户端
│   ├── indexeddb/         # IndexedDB 客户端
│   └── mock/              # Mock 客户端
├── interfaces.ts      # 接口定义
├── types/            # 类型定义
├── schema/           # 数据库模式
├── test/             # 测试文件
└── factory.ts        # 工厂函数
```

#### 命名规范
1. 类名：使用 PascalCase（如 `SQLiteClient`）
2. 方法名：使用 camelCase（如 `findById`）
3. 变量名：使用 camelCase（如 `queryResult`）
4. 常量名：使用 UPPER_SNAKE_CASE（如 `MAX_CACHE_SIZE`）
5. 接口名：使用 PascalCase，以 I 开头（如 `IDatabaseClient`）

### 1.2 类型安全

#### 使用 TypeScript 类型
```typescript
// 定义实体接口
interface User extends BaseEntity {
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  birthDate: Date;
}

// 使用泛型方法
async findById<T extends BaseEntity>(
  tableName: string,
  id: string
): Promise<T | null>
```

#### 类型检查
```typescript
// 运行时类型检查
function validateUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'name' in user &&
    'email' in user
  );
}
```

### 1.3 错误处理

#### 自定义错误类
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ValidationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}
```

#### 错误处理模式
```typescript
try {
  await client.createUser(userData);
} catch (error) {
  if (error instanceof ValidationError) {
    // 处理验证错误
    console.error('Validation failed:', error.details);
  } else if (error instanceof DatabaseError) {
    // 处理数据库错误
    console.error('Database error:', error.message);
  } else {
    // 处理其他错误
    console.error('Unexpected error:', error);
  }
  throw error; // 重新抛出错误
}
```

## 2. 测试阶段最佳实践

### 2.1 单元测试

#### 测试结构
```typescript
describe('SQLiteClient', () => {
  let client: SQLiteClient;
  
  beforeEach(async () => {
    client = new SQLiteClient(config);
    await client.initialize();
  });
  
  afterEach(async () => {
    await client.close();
  });
  
  describe('CRUD operations', () => {
    it('should create and retrieve user', async () => {
      // 测试代码
    });
  });
});
```

#### 测试数据管理
```typescript
// 使用工厂函数创建测试数据
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: generateId(),
    name: 'Test User',
    email: 'test@example.com',
    interests: ['test'],
    birthDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}
```

### 2.2 集成测试

#### 测试环境设置
```typescript
describe('Database Integration', () => {
  let db: SQLiteClient;
  
  beforeAll(async () => {
    // 设置测试数据库
    db = await setupTestDatabase();
  });
  
  afterAll(async () => {
    // 清理测试数据库
    await cleanupTestDatabase();
  });
  
  it('should handle complex transactions', async () => {
    // 测试代码
  });
});
```

#### 事务测试
```typescript
it('should rollback on error', async () => {
  const user = createTestUser();
  
  try {
    await db.transaction(async () => {
      await db.createUser(user);
      throw new Error('Transaction failed');
    });
  } catch (error) {
    // 验证事务已回滚
    const created = await db.findById<User>('users', user.id);
    expect(created).toBeNull();
  }
});
```

## 3. 部署阶段最佳实践

### 3.1 数据库迁移

#### 迁移脚本
```typescript
// 迁移管理器
class MigrationManager {
  async migrate(): Promise<void> {
    const migrations = await this.getPendingMigrations();
    
    for (const migration of migrations) {
      await this.executeMigration(migration);
      await this.recordMigration(migration);
    }
  }
  
  private async executeMigration(migration: Migration): Promise<void> {
    await this.db.transaction(async () => {
      await this.db.executeRawQuery(migration.sql);
    });
  }
}
```

#### 版本控制
```typescript
interface Migration {
  version: number;
  name: string;
  sql: string;
  timestamp: Date;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_users_table',
    sql: 'CREATE TABLE users...',
    timestamp: new Date('2024-03-29')
  }
];
```

### 3.2 数据备份

#### 备份策略
```typescript
class BackupManager {
  async createBackup(): Promise<void> {
    const backupPath = this.getBackupPath();
    await this.db.executeRawQuery(`BACKUP TO '${backupPath}'`);
  }
  
  async restoreFromBackup(backupPath: string): Promise<void> {
    await this.db.executeRawQuery(`RESTORE FROM '${backupPath}'`);
  }
}
```

#### 自动备份
```typescript
class AutoBackupManager {
  private backupInterval: number;
  
  constructor(interval: number = 24 * 60 * 60 * 1000) {
    this.backupInterval = interval;
  }
  
  startAutoBackup(): void {
    setInterval(async () => {
      await this.createBackup();
    }, this.backupInterval);
  }
}
```

### 3.3 监控和日志

#### 性能监控
```typescript
class DatabaseMonitor {
  private metrics: Map<string, number[]>;
  
  recordQueryTime(query: string, duration: number): void {
    if (!this.metrics.has(query)) {
      this.metrics.set(query, []);
    }
    this.metrics.get(query)!.push(duration);
  }
  
  getSlowQueries(threshold: number): string[] {
    return Array.from(this.metrics.entries())
      .filter(([_, times]) => 
        times.some(time => time > threshold)
      )
      .map(([query]) => query);
  }
}
```

#### 日志记录
```typescript
class DatabaseLogger {
  log(level: 'info' | 'warn' | 'error', message: string, context?: any): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }));
  }
}
```

## 4. 安全最佳实践

### 4.1 数据加密

#### 敏感数据加密
```typescript
class EncryptionManager {
  async encrypt(data: string): Promise<string> {
    // 实现加密逻辑
  }
  
  async decrypt(encrypted: string): Promise<string> {
    // 实现解密逻辑
  }
}
```

#### 密钥管理
```typescript
class KeyManager {
  private static instance: KeyManager;
  private key: string;
  
  private constructor() {
    this.key = process.env.DATABASE_ENCRYPTION_KEY || 'default-key';
  }
  
  static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }
}
```

### 4.2 访问控制

#### 权限管理
```typescript
interface DatabasePermission {
  table: string;
  operation: 'read' | 'write' | 'delete';
  roles: string[];
}

class PermissionManager {
  private permissions: DatabasePermission[];
  
  async checkPermission(
    user: User,
    table: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    // 实现权限检查逻辑
  }
}
```

## 5. 性能最佳实践

### 5.1 查询优化

#### 索引使用
```typescript
// 创建索引
await client.executeRawQuery(
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'
);

// 使用索引
const user = await client.executeRawQuery(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

#### 查询缓存
```typescript
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
}
```

### 5.2 批量操作

#### 事务使用
```typescript
// 批量插入
await client.transaction(async () => {
  for (const user of users) {
    await client.createUser(user);
  }
});

// 批量更新
await client.executeRawQuery(
  'UPDATE users SET status = ? WHERE id IN (?)',
  ['active', userIds]
);
```

## 6. 维护最佳实践

### 6.1 数据库维护

#### 定期优化
```typescript
class DatabaseMaintenance {
  async optimize(): Promise<void> {
    // 执行 VACUUM
    await this.client.executeRawQuery('VACUUM');
    
    // 重建索引
    await this.client.executeRawQuery('REINDEX');
    
    // 清理过期数据
    await this.cleanupExpiredData();
  }
}
```

#### 监控告警
```typescript
class DatabaseMonitor {
  async checkHealth(): Promise<void> {
    const stats = await this.getStorageStats();
    
    if (stats.totalSize > this.threshold) {
      await this.sendAlert('Storage space running low');
    }
    
    const slowQueries = await this.getSlowQueries();
    if (slowQueries.length > 0) {
      await this.sendAlert('Slow queries detected');
    }
  }
}
```

### 6.2 版本管理

#### 版本控制
```typescript
interface DatabaseVersion {
  version: number;
  appliedAt: Date;
  description: string;
}

class VersionManager {
  async getCurrentVersion(): Promise<number> {
    const version = await this.client.executeRawQuery(
      'SELECT version FROM schema_version'
    );
    return version[0].version;
  }
  
  async updateVersion(newVersion: number): Promise<void> {
    await this.client.executeRawQuery(
      'UPDATE schema_version SET version = ?',
      [newVersion]
    );
  }
}
```

## 7. 总结

1. **开发阶段**
   - 遵循代码组织规范
   - 确保类型安全
   - 实现错误处理

2. **测试阶段**
   - 编写单元测试
   - 实现集成测试
   - 管理测试数据

3. **部署阶段**
   - 实现数据库迁移
   - 配置数据备份
   - 设置监控和日志

4. **安全**
   - 实现数据加密
   - 管理访问权限
   - 保护敏感数据

5. **性能**
   - 优化查询
   - 使用缓存
   - 批量操作

6. **维护**
   - 定期优化
   - 监控告警
   - 版本管理 