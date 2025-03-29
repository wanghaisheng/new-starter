# 数据库最佳实践指南

## 概述

本文档提供了数据库开发、测试和部署的最佳实践指南，帮助团队保持一致的开发标准和质量。本指南与架构文档（`docs/lessons/database/best-practise.md`）配合使用，为团队提供全面的数据库开发参考。

## 1. 存储策略与环境配置

### 1.1 开发阶段（Mock）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=mock`
- 存储类型：Mock IndexedDB（使用 fake-indexeddb）
- 特点：
  - 快速原型验证
  - 预设测试数据
  - 支持完整的 IndexedDB API
  - 可在 Node.js 环境中运行

### 1.2 本地阶段（Local）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=local`
- Web环境：IndexedDB
- 移动端：SQLite
- 特点：支持离线操作，数据持久化

### 1.3 生产阶段（Production）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=production`
- 存储类型：混合存储（本地+云端）
- 云端选项：Firebase/Supabase
- 特点：多设备支持，数据同步

### 1.4 数据同步策略

#### 在线优先（Online-First）
- 适用场景：用户注册、个人资料更新
- 特点：优先云端操作，网络不可用时回退本地

#### 离线优先（Offline-First）
- 适用场景：消息、匹配操作
- 特点：优先本地操作，后台同步云端

#### 手动同步（Manual）
- 适用场景：批量数据同步、大文件传输
- 特点：用户主动触发，可控同步过程

## 2. 开发阶段最佳实践

### 2.1 代码组织

#### 目录结构
```
src/core/lib/db/
├── clients/           # 数据库客户端实现
│   ├── capacitor-sqlite/  # 移动端SQLite客户端
│   │   ├── sqlite-client.ts       # 主客户端实现
│   │   ├── migration-manager.ts   # 迁移管理
│   │   ├── backup-manager.ts      # 备份管理
│   │   └── performance-manager.ts # 性能管理
│   ├── indexeddb/         # Web端IndexedDB客户端
│   │   ├── indexeddb-client.ts          # 基本实现
│   │   └── optimized-indexeddb-client.ts # 优化实现
│   ├── mock/              # Mock环境实现
│   │   ├── mock-client.ts          # 通用Mock客户端
│   │   └── indexeddb-client.ts     # Mock IndexedDB
│   ├── firebase/          # Firebase客户端
│   ├── hybrid/            # 混合存储客户端
│   ├── sync/              # 同步客户端
│   └── base-client.ts     # 基础客户端抽象
├── repositories/      # 数据访问层
│   ├── base-repository.ts  # 基础仓库
│   ├── user-repository.ts  # 用户数据仓库
│   ├── message-repository.ts # 消息仓库
│   └── match-repository.ts # 匹配仓库
├── schema/           # 数据模型定义
│   ├── definitions/       # 表结构定义
│   ├── adapters/          # ORM适配器
│   ├── version-manager.ts # 版本管理
│   └── versions.ts        # 版本定义
├── types/            # 类型定义
├── test/             # 测试文件
│   ├── clients/           # 客户端测试
│   ├── repositories/      # 仓库测试
│   ├── journey/           # 流程测试
│   ├── simulators/        # 模拟器
│   └── tools/             # 测试工具
├── interfaces.ts     # 接口定义
├── factory.ts        # 工厂函数
├── config.ts         # 配置管理
└── service.ts        # 核心服务实现
```

#### 命名规范
1. 类名：使用 PascalCase（如 `SQLiteClient`）
2. 方法名：使用 camelCase（如 `findById`）
3. 变量名：使用 camelCase（如 `queryResult`）
4. 常量名：使用 UPPER_SNAKE_CASE（如 `MAX_CACHE_SIZE`）
5. 接口名：使用 PascalCase，以 I 开头（如 `IDatabaseClient`）

### 2.2 类型安全

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

### 2.3 错误处理

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

## 3. 测试阶段最佳实践

### 3.1 单元测试

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

### 3.2 集成测试

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

## 4. 部署阶段最佳实践

### 4.1 数据库迁移

#### 迁移脚本
```typescript
// 迁移管理器
class MigrationManager {
  constructor(private db: IBaseDatabaseClient) {}

  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = await this.getPendingMigrations(currentVersion);
    
    for (const migration of migrations) {
      await this.executeMigration(migration);
      await this.recordMigration(migration);
    }
  }
  
  private async executeMigration(migration: Migration): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const statement of migration.statements) {
        await tx.executeRawQuery(statement);
      }
    });
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.executeRawQuery<{version: number}>(
        'SELECT version FROM schema_version LIMIT 1'
      );
      return result.length > 0 ? result[0].version : 0;
    } catch (error) {
      // 表不存在，创建版本表
      await this.db.executeRawQuery(
        'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)'
      );
      await this.db.executeRawQuery('INSERT INTO schema_version (version) VALUES (0)');
      return 0;
    }
  }
}
```

#### 版本控制
```typescript
interface Migration {
  version: number;
  name: string;
  statements: string[];
  timestamp: Date;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_users_table',
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    ],
    timestamp: new Date('2024-03-29')
  },
  {
    version: 2,
    name: 'add_user_profile_fields',
    statements: [
      `ALTER TABLE users ADD COLUMN photoUrl TEXT;`,
      `ALTER TABLE users ADD COLUMN bio TEXT;`,
      `ALTER TABLE users ADD COLUMN interests TEXT;`
    ],
    timestamp: new Date('2024-04-05')
  }
];
```

### 4.2 数据备份

#### 备份策略
```typescript
class BackupManager {
  constructor(
    private db: IBaseDatabaseClient,
    private storageManager: StorageManager
  ) {}

  async createBackup(): Promise<string> {
    const backupPath = this.getBackupPath();
    const tables = await this.getTables();
    const backupData: Record<string, any[]> = {};
    
    // 导出所有表数据
    for (const table of tables) {
      const data = await this.db.findAll(table);
      backupData[table] = data;
    }
    
    // 保存备份文件
    await this.storageManager.writeFile(
      backupPath,
      JSON.stringify(backupData, null, 2)
    );
    
    return backupPath;
  }
  
  async restoreFromBackup(backupPath: string): Promise<void> {
    const backupContent = await this.storageManager.readFile(backupPath);
    const backupData = JSON.parse(backupContent);
    
    await this.db.transaction(async (tx) => {
      // 清空现有数据
      const tables = Object.keys(backupData);
      for (const table of tables) {
        await tx.executeRawQuery(`DELETE FROM ${table}`);
      }
      
      // 恢复备份数据
      for (const [table, records] of Object.entries(backupData)) {
        for (const record of records as any[]) {
          await tx.create(table, record);
        }
      }
    });
  }
  
  private async getTables(): Promise<string[]> {
    const result = await this.db.executeRawQuery<{name: string}>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return result.map(row => row.name);
  }
  
  private getBackupPath(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup_${timestamp}.json`;
  }
}
```

#### 自动备份
```typescript
class AutoBackupManager {
  private backupInterval: number;
  private backupTimer: NodeJS.Timeout | null = null;
  private maxBackups: number;
  
  constructor(
    private backupManager: BackupManager,
    private storageManager: StorageManager,
    options: {
      interval?: number;
      maxBackups?: number;
    } = {}
  ) {
    this.backupInterval = options.interval || 24 * 60 * 60 * 1000; // 默认每天
    this.maxBackups = options.maxBackups || 7; // 默认保留7个备份
  }
  
  startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('自动备份失败:', error);
      }
    }, this.backupInterval);
  }
  
  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
  
  private async createBackup(): Promise<string> {
    return this.backupManager.createBackup();
  }
  
  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.storageManager.listFiles('backup_*.json');
    
    // 按创建时间排序
    backups.sort((a, b) => {
      const timeA = this.getTimestampFromBackupName(a);
      const timeB = this.getTimestampFromBackupName(b);
      return timeB.getTime() - timeA.getTime(); // 降序
    });
    
    // 删除超出保留数量的旧备份
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        await this.storageManager.deleteFile(backup);
      }
    }
  }
  
  private getTimestampFromBackupName(filename: string): Date {
    const match = filename.match(/backup_(.*)\.json/);
    if (match && match[1]) {
      const timestamp = match[1].replace(/-/g, (m, i) => i % 3 === 2 ? ':' : m);
      return new Date(timestamp);
    }
    return new Date(0); // 默认值
  }
}
```

### 4.3 监控和日志

#### 性能监控
```typescript
class DatabaseMonitor {
  private metrics: Map<string, number[]>;
  private queryCount: Map<string, number>;
  private slowQueryThreshold: number;
  private logger: DatabaseLogger;
  
  constructor(options: {
    slowQueryThreshold?: number;
    logger?: DatabaseLogger;
  } = {}) {
    this.metrics = new Map<string, number[]>();
    this.queryCount = new Map<string, number>();
    this.slowQueryThreshold = options.slowQueryThreshold || 100; // 默认100ms
    this.logger = options.logger || new DatabaseLogger();
  }
  
  recordQueryTime(query: string, duration: number): void {
    // 记录查询时间
    if (!this.metrics.has(query)) {
      this.metrics.set(query, []);
    }
    this.metrics.get(query)!.push(duration);
    
    // 记录查询次数
    const count = this.queryCount.get(query) || 0;
    this.queryCount.set(query, count + 1);
    
    // 记录慢查询
    if (duration > this.slowQueryThreshold) {
      this.logger.log('warn', `慢查询检测: ${duration}ms`, { query });
    }
  }
  
  getSlowQueries(threshold?: number): Array<{query: string, avgTime: number, count: number}> {
    const actualThreshold = threshold || this.slowQueryThreshold;
    
    return Array.from(this.metrics.entries())
      .map(([query, times]) => {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const count = this.queryCount.get(query) || 0;
        return { query, avgTime, count };
      })
      .filter(item => item.avgTime > actualThreshold)
      .sort((a, b) => b.avgTime - a.avgTime); // 按平均时间降序排序
  }
  
  getQueryStats(): Array<{query: string, min: number, max: number, avg: number, count: number}> {
    return Array.from(this.metrics.entries())
      .map(([query, times]) => {
        const min = Math.min(...times);
        const max = Math.max(...times);
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const count = this.queryCount.get(query) || 0;
        return { query, min, max, avg, count };
      })
      .sort((a, b) => b.count - a.count); // 按查询次数降序排序
  }
  
  resetMetrics(): void {
    this.metrics.clear();
    this.queryCount.clear();
  }
}
```

#### 日志记录
```typescript
class DatabaseLogger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private logHandlers: Array<(entry: LogEntry) => void>;
  
  constructor(options: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    handlers?: Array<(entry: LogEntry) => void>;
  } = {}) {
    this.logLevel = options.level || 'info';
    this.logHandlers = options.handlers || [this.consoleLogHandler];
  }
  
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
    
    // 发送到所有处理器
    for (const handler of this.logHandlers) {
      try {
        handler(entry);
      } catch (error) {
        console.error('日志处理器错误:', error);
      }
    }
  }
  
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
  
  private consoleLogHandler(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;
    const formattedContext = context ? `\n${JSON.stringify(context, null, 2)}` : '';
    
    switch (level) {
      case 'debug':
        console.debug(`[${timestamp}] [DEBUG] ${message}${formattedContext}`);
        break;
      case 'info':
        console.info(`[${timestamp}] [INFO] ${message}${formattedContext}`);
        break;
      case 'warn':
        console.warn(`[${timestamp}] [WARN] ${message}${formattedContext}`);
        break;
      case 'error':
        console.error(`[${timestamp}] [ERROR] ${message}${formattedContext}`);
        break;
    }
  }
  
  addHandler(handler: (entry: LogEntry) => void): void {
    this.logHandlers.push(handler);
  }
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
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