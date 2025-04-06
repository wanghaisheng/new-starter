# 数据库最佳实践指南

## 概述

本文档提供了数据库开发、测试和部署的最佳实践指南，帮助团队保持一致的开发标准和质量。本指南与架构文档（`docs/lessons/database/best-practise.md`）配合使用，为团队提供全面的数据库开发参考。

项目采用分层架构设计，支持多环境数据存储和同步。主要特点包括：

- **工厂模式的应用**：项目使用了DataServiceFactory工厂类来获取数据服务实例，而不是直接实例化具体的服务类。这符合依赖注入和控制反转的设计原则，使代码更易于测试和维护。
- **接口分离原则**：项目定义了IDataService接口，并由具体的实现类（如MockDataService）来实现。这使得系统可以轻松切换不同的数据源实现，而不影响上层业务逻辑。
- **单例模式的使用**：各服务类（如DatabaseService、UserService、MockDataService）都使用了单例模式，确保全应用共享同一个服务实例，避免资源浪费。
- **环境适配**：根据不同的环境（mock、local、production）选择不同的存储策略，实现无缝切换。

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

## 4. 工厂模式与服务层架构

### 4.1 工厂模式实现

在我们的项目中，工厂模式是实现依赖注入和解耦的关键机制。主要有两个工厂实现：

#### 4.1.1 DatabaseFactory

`DatabaseFactory` 位于 `src/core/lib/db/factory.ts`，负责创建和管理数据库客户端实例：

```typescript
export class DatabaseFactory {
  private static clientRegistry: Map<string, any> = new Map();
  
  // 注册数据库客户端类型
  static registerClientType(type: string, clientClass: any): void {
    this.clientRegistry.set(type.toLowerCase(), clientClass);
  }
  
  // 创建数据库客户端
  static createClient(type: string, config: DatabaseConfig): IDatabaseClient {
    const clientClass = this.clientRegistry.get(type.toLowerCase());
    if (!clientClass) {
      throw new Error(`未知的数据库客户端类型: ${type}`);
    }
    return new clientClass(config);
  }
  
  // 根据环境变量创建数据库客户端
  static createClientFromEnv(): IDatabaseClient {
    // 获取环境变量并创建相应的客户端
    // ...
  }
}
```

这种设计允许我们：
- 动态注册不同类型的数据库客户端
- 根据配置或环境变量创建适当的客户端实例
- 在不修改现有代码的情况下添加新的客户端类型

#### 4.1.2 DataServiceFactory

`DataServiceFactory` 位于 `src/core/services/data-service-factory.ts`，负责创建和管理数据服务实例：

```typescript
export class DataServiceFactory {
  private static instance: IDataService;

  public static getInstance(): IDataService {
    if (!DataServiceFactory.instance) {
      const databaseEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      
      switch (databaseEnv) {
        case 'mock':
          DataServiceFactory.instance = MockDataService.getInstance();
          break;
        case 'local':
          // 根据平台选择不同的实现
          if (Capacitor.isNativePlatform()) {
            DataServiceFactory.instance = DatabaseService.getInstance();
          } else {
            DataServiceFactory.instance = MockDataService.getInstance();
          }
          break;
        // 其他环境...
      }
    }
    return DataServiceFactory.instance;
  }
}
```

这种设计允许我们：
- 根据环境配置选择适当的服务实现
- 在应用程序中使用统一的接口访问数据
- 轻松切换不同的数据服务实现，而不影响业务逻辑

### 4.2 服务层架构

我们的服务层架构采用了分层设计，确保关注点分离和代码的可维护性。

#### 4.2.1 服务层结构

```
src/core/services/
├── data-service-factory.ts    # 数据服务工厂
├── data-service.interface.ts  # 数据服务接口
├── database-service.ts        # 数据库服务实现
├── mock-data-service.ts       # 模拟数据服务实现
├── user-service.ts            # 用户服务
├── message-service.ts         # 消息服务
└── ... 其他服务
```

#### 4.2.2 服务层职责

1. **接口层**：`data-service.interface.ts` 定义了数据服务的统一接口，所有实现必须遵循这个接口。

```typescript
export interface IDataService {
  // 用户操作
  getUser(id: string): Promise<User | null>;
  getUsers(): Promise<User[]>;
  createUser(user: User): Promise<User>;
  // ... 其他方法
}
```

2. **实现层**：包括 `database-service.ts` 和 `mock-data-service.ts` 等，提供了接口的具体实现。

3. **工厂层**：`data-service-factory.ts` 负责根据环境配置创建适当的服务实例。

4. **业务服务层**：如 `user-service.ts` 和 `message-service.ts`，封装了特定领域的业务逻辑。

#### 4.2.3 DatabaseService 实现

`DatabaseService` 类是核心数据库服务的实现，它使用单例模式确保全局只有一个实例：

```typescript
export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private isInitialized = false;
  
  // 仓储实例
  private userRepository: UserRepository;
  private matchRepository: MatchRepository;
  private messageRepository: MessageRepository;

  private constructor() {
    // 使用工厂方法根据环境变量创建客户端
    this.client = DatabaseFactory.createClientFromEnv();
    
    // 初始化仓储
    this.userRepository = new UserRepository(this.client);
    this.matchRepository = new MatchRepository(this.client);
    this.messageRepository = new MessageRepository(this.client);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  // ... 其他方法
}
```

### 4.3 服务使用最佳实践

#### 4.3.1 在组件中使用服务

**推荐做法**：

```typescript
import { DataServiceFactory } from '@/core/services/data-service-factory';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function loadUser() {
      const dataService = DataServiceFactory.getInstance();
      const userData = await dataService.getUser(userId);
      setUser(userData);
    }
    loadUser();
  }, [userId]);
  
  // 渲染用户资料
}
```

**不推荐做法**：

```typescript
// 不要直接导入模型或数据库客户端
import { User } from '@/core/lib/db/models';
import { DatabaseService } from '@/core/lib/db/service';

function UserProfile({ userId }) {
  // 直接使用 DatabaseService 或访问底层实现
  // ...
}
```

#### 4.3.2 添加新服务

当需要添加新的服务时，应遵循以下步骤：

1. 在 `data-service.interface.ts` 中添加新的方法定义
2. 在所有实现类（如 `database-service.ts` 和 `mock-data-service.ts`）中实现这些方法
3. 如果需要，创建新的仓储类处理特定的数据访问逻辑
4. 更新工厂类以支持新的服务类型（如果需要）

#### 4.3.3 服务层与仓储层的关系

- **服务层**：负责业务逻辑，可能组合多个仓储操作，处理事务和错误
- **仓储层**：负责数据访问逻辑，提供 CRUD 操作和查询方法
- **客户端层**：负责与具体数据存储的交互，如 IndexedDB 或 SQLite

这种分层设计确保了：

- 业务逻辑与数据访问逻辑分离
- 可以轻松替换底层数据存储而不影响业务逻辑
- 代码更易于测试和维护

### 4.4 环境适配策略

我们的服务层架构支持在不同环境中无缝切换：

1. **开发环境**：使用 `MockDataService` 提供模拟数据，加速开发和测试
2. **本地环境**：根据平台使用 `IndexedDBClient` 或 `CapacitorSQLiteClient`
3. **生产环境**：使用混合存储策略，支持在线和离线操作

通过环境变量 `NEXT_PUBLIC_DATABASE_ENV` 控制使用哪种服务实现，无需修改代码即可切换环境。

```typescript
// 根据环境变量自动切换数据源
public static getInstance(): IDataService {
  if (!DataServiceFactory.instance) {
    const databaseEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    
    switch (databaseEnv) {
      case 'mock':
        DataServiceFactory.instance = MockDataService.getInstance();
        break;
      case 'local':
        // 在移动平台使用 SQLite
        if (Capacitor.isNativePlatform()) {
          DataServiceFactory.instance = DatabaseService.getInstance();
        } else {
          // 在 Web 平台使用 IndexedDB
          DataServiceFactory.instance = MockDataService.getInstance();
        }
        break;
      case 'production':
        // 生产环境使用混合存储
        DataServiceFactory.instance = HybridDataService.getInstance();
        break;
      default:
        // 默认使用 Mock 数据服务
        DataServiceFactory.instance = MockDataService.getInstance();
    }
  }
  return DataServiceFactory.instance;
}

## 5. 部署阶段最佳实践

### 5.1 数据库迁移

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

## 7. 数据访问最佳实践

### 7.1 组件与页面数据访问模式

在应用开发中，组件和页面应该通过统一的数据服务接口访问数据，而不是直接导入模型或mock数据。这种模式有以下优势：

1. **环境适应性**：根据环境变量自动切换数据源（mock、local、production）
2. **关注点分离**：UI组件专注于展示逻辑，数据访问逻辑封装在服务中
3. **可测试性**：便于模拟数据服务进行单元测试
4. **一致性**：确保所有组件使用相同的数据访问方式
5. **可维护性**：当数据访问逻辑变更时，只需修改服务实现，而不影响UI组件

#### 7.1.1 错误示例

以下是不推荐的数据访问方式：

```typescript
// 错误示例：直接导入mock数据
import { getRecommendedUsers } from '@/core/lib/db/models/mock-data';

function DiscoverPage() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // 直接使用mock数据，无法根据环境切换数据源
    const recommendedUsers = getRecommendedUsers();
    setUsers(recommendedUsers);
  }, []);
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

#### 7.1.2 正确示例

以下是推荐的数据访问方式：

```typescript
// 正确示例：使用数据服务工厂
import { DataServiceFactory } from '@/core/services/data-service-factory';
import { useEffect, useState } from 'react';
import { User } from '@/core/types';

function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // 通过工厂获取服务实例，自动根据环境变量选择合适的实现
        const userService = await DataServiceFactory.getInstance().getUserService();
        const recommendedUsers = await userService.getRecommendedUsers();
        setUsers(recommendedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    
    loadUsers();
  }, []);
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### 7.2 数据服务接口设计

为确保数据访问的一致性，应为每种实体类型定义明确的服务接口：

```typescript
// 用户服务接口
export interface IUserService {
  // 基本CRUD操作
  getUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, keyof BaseEntity>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // 业务特定操作
  getRecommendedUsers(preferences?: UserPreferences): Promise<User[]>;
  getUsersByLocation(location: Location, radius: number): Promise<User[]>;
  updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void>;
}

// 匹配服务接口
export interface IMatchService {
  getMatchById(id: string): Promise<Match | null>;
  createMatch(match: Omit<Match, keyof BaseEntity>): Promise<Match>;
  updateMatchStatus(id: string, status: Match['status']): Promise<void>;
  getUserMatches(userId: string): Promise<Match[]>;
  performMatchAction(action: MatchAction): Promise<Match | null>;
}

// 消息服务接口
export interface IMessageService {
  getMessagesByMatchId(matchId: string): Promise<Message[]>;
  sendMessage(message: Omit<Message, keyof BaseEntity>): Promise<Message>;
  markMessagesAsRead(matchId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
}
```

### 7.3 服务实现与环境切换

服务实现应根据环境变量自动切换：

```typescript
// 用户服务工厂方法
async getUserService(): Promise<IUserService> {
  if (!this.services.has('user')) {
    switch (this.databaseEnv) {
      case 'production':
        // 生产环境：使用真实数据库
        const client = await this.getCloudDatabaseClient();
        const repository = new UserRepository(client);
        this.services.set('user', new UserService(repository));
        break;
      case 'local':
        // 本地环境：使用本地数据库
        const localClient = await this.getLocalDatabaseClient();
        const localRepository = new UserRepository(localClient);
        this.services.set('user', new UserService(localRepository));
        break;
      default:
        // 开发环境：使用模拟数据
        this.services.set('user', new MockUserService());
    }
  }
  return this.services.get('user');
}
```

### 7.4 模拟服务实现

模拟服务应实现与真实服务相同的接口，但使用内存数据：

```typescript
// 模拟用户服务
export class MockUserService implements IUserService {
  private users: User[] = [];
  
  constructor() {
    // 初始化模拟数据
    this.users = require('@/core/lib/db/clients/mock/data/user-data.json');
  }
  
  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }
  
  async getRecommendedUsers(preferences?: UserPreferences): Promise<User[]> {
    // 模拟推荐算法
    return this.users.slice(0, 10);
  }
  
  // 实现其他接口方法...
}
```

## 8. 总结

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
   
7. **数据访问**
   - 使用服务接口访问数据
   - 通过工厂模式获取服务实例
   - 根据环境变量自动切换数据源
   - 避免直接导入模型或mock数据

## 5. Ionic 与 React Hooks 集成

### 5.1 概述

Ionic 完全支持 React 和 React Hooks，我们可以充分利用 Hooks 的特性来管理 Ionic 应用中的状态和副作用。本节将详细介绍如何在 Ionic 应用中最佳地使用 React Hooks。

### 5.2 Ionic 生命周期与 Hooks

#### 5.2.1 生命周期映射

Ionic 的生命周期方法可以通过 Hooks 实现：

```typescript
// 传统 Ionic 生命周期
class MyPage extends React.Component {
  ionViewDidEnter() {
    // 页面进入时的逻辑
  }
  
  ionViewWillLeave() {
    // 页面离开时的逻辑
  }
}

// 使用 Hooks 实现
const MyPage: React.FC = () => {
  // 使用 Ionic 提供的 Hooks
  useIonViewDidEnter(() => {
    // 页面进入时的逻辑
  });

  useIonViewWillLeave(() => {
    // 页面离开时的逻辑
  });

  return (
    // ... 组件内容
  );
};
```

#### 5.2.2 常用生命周期 Hooks

```typescript
import {
  useIonViewDidEnter,
  useIonViewWillEnter,
  useIonViewDidLeave,
  useIonViewWillLeave,
  useIonViewCanEnter,
  useIonViewCanLeave
} from '@ionic/react';

const MyPage: React.FC = () => {
  // 页面即将进入
  useIonViewWillEnter(() => {
    console.log('页面即将进入');
  });

  // 页面已进入
  useIonViewDidEnter(() => {
    console.log('页面已进入');
  });

  // 页面即将离开
  useIonViewWillLeave(() => {
    console.log('页面即将离开');
  });

  // 页面已离开
  useIonViewDidLeave(() => {
    console.log('页面已离开');
  });

  // 控制页面是否可以进入
  useIonViewCanEnter(() => {
    return true; // 返回 false 将阻止页面进入
  });

  // 控制页面是否可以离开
  useIonViewCanLeave(() => {
    return true; // 返回 false 将阻止页面离开
  });

  return (
    // ... 组件内容
  );
};
```

### 5.3 Ionic 特定功能与 Hooks

#### 5.3.1 创建 Ionic 服务 Hook

```typescript
// src/core/hooks/useIonService.ts
import { IonLoading, IonToast, IonAlert } from '@ionic/react';
import { useServices } from './useServices';

export function useIonService() {
  const { userService, messageService } = useServices();
  const [loading, setLoading] = useState<HTMLIonLoadingElement | null>(null);
  const [toast, setToast] = useState<HTMLIonToastElement | null>(null);
  const [alert, setAlert] = useState<HTMLIonAlertElement | null>(null);

  const showLoading = async (message: string) => {
    const loading = await IonLoading.create({
      message,
      duration: 2000
    });
    setLoading(loading);
    await loading.present();
  };

  const hideLoading = async () => {
    if (loading) {
      await loading.dismiss();
      setLoading(null);
    }
  };

  const showToast = async (message: string, duration = 2000) => {
    const toast = await IonToast.create({
      message,
      duration,
      position: 'bottom'
    });
    setToast(toast);
    await toast.present();
  };

  const showAlert = async (options: AlertOptions) => {
    const alert = await IonAlert.create(options);
    setAlert(alert);
    await alert.present();
  };

  return {
    userService,
    messageService,
    showLoading,
    hideLoading,
    showToast,
    showAlert
  };
}
```

#### 5.3.2 在页面中使用 Ionic 服务 Hook

```typescript
// src/mobile/pages/ProfilePage.tsx
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useIonService } from '@/core/hooks/useIonService';

export const ProfilePage: React.FC = () => {
  const { userService, showLoading, showToast, showAlert } = useIonService();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = async () => {
    try {
      await showLoading('Loading profile...');
      const userProfile = await userService?.getCurrentUser();
      setProfile(userProfile);
    } catch (error) {
      await showToast('Failed to load profile');
    } finally {
      await hideLoading();
    }
  };

  const handleDelete = async () => {
    await showAlert({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete your profile?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            try {
              await showLoading('Deleting profile...');
              await userService?.deleteProfile();
              await showToast('Profile deleted successfully');
            } catch (error) {
              await showToast('Failed to delete profile');
            } finally {
              await hideLoading();
            }
          }
        }
      ]
    });
  };

  useEffect(() => {
    loadProfile();
  }, [userService]);

  return (
    <IonPage>
      <IonContent>
        {/* 使用 Ionic 组件显示数据 */}
      </IonContent>
    </IonPage>
  );
};
```

### 5.4 性能优化

#### 5.4.1 使用 useMemo 优化渲染

```typescript
const UserListPage: React.FC = () => {
  const { userService } = useServices();
  const [users, setUsers] = useState<User[]>([]);

  // 缓存用户列表渲染函数
  const renderUserItem = useMemo(() => (user: User) => (
    <IonItem key={user.id}>
      <IonLabel>{user.name}</IonLabel>
      <IonButton slot="end" onClick={() => handleUserAction(user)}>
        Action
      </IonButton>
    </IonItem>
  ), []);

  // 缓存用户操作处理函数
  const handleUserAction = useCallback(async (user: User) => {
    // 处理用户操作
  }, []);

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {users.map(renderUserItem)}
        </IonList>
      </IonContent>
    </IonPage>
  );
};
```

#### 5.4.2 使用 useCallback 优化事件处理

```typescript
const ChatPage: React.FC = () => {
  const { messageService } = useServices();
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!messageService) return;
    
    try {
      await messageService.sendMessage(text);
      // 更新消息列表
    } catch (error) {
      // 错误处理
    }
  }, [messageService]);

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {messages.map(message => (
            <IonItem key={message.id}>
              {message.text}
            </IonItem>
          ))}
        </IonList>
        <IonButton onClick={() => handleSendMessage('Hello')}>
          Send
        </IonButton>
      </IonContent>
    </IonPage>
  );
};
```

### 5.5 最佳实践

1. **生命周期管理**
   - 使用 Ionic 提供的生命周期 Hooks 替代类组件的生命周期方法
   - 在适当的生命周期 Hook 中初始化和清理资源

2. **状态管理**
   - 使用 `useState` 管理本地状态
   - 使用 `useReducer` 管理复杂状态
   - 使用 Context API 管理全局状态

3. **性能优化**
   - 使用 `useMemo` 缓存计算结果
   - 使用 `useCallback` 缓存函数
   - 使用 `React.memo` 优化组件重渲染

4. **错误处理**
   - 使用 Ionic 的 Toast 和 Alert 组件显示错误信息
   - 实现统一的错误处理机制
   - 提供清晰的错误恢复策略

5. **代码组织**
   - 创建可复用的自定义 Hooks
   - 将业务逻辑从组件中抽离
   - 保持组件的单一职责