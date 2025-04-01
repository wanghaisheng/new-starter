# 数据库架构与实现指南

## 1. 架构概述

项目采用分层架构设计，支持多环境数据存储和同步：

```
src/core/lib/db/
├── clients/          # 数据库客户端实现
│   ├── capacitor-sqlite/  # 移动端SQLite
│   ├── indexeddb/        # Web端IndexedDB
│   ├── mock/            # Mock环境实现
│   │   └── indexeddb-client.ts  # Mock IndexedDB
│   └── base-client.ts    # 基础客户端抽象
├── repositories/     # 数据访问层
├── schema/          # 数据模型定义
├── types/           # 类型定义
└── service.ts       # 核心服务实现
```

## 2. 存储策略

### 2.1 开发阶段（Mock）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=mock`
- 存储类型：json/内存
- 特点：
  - 快速原型验证
  - 预设测试数据
  - 支持完整的 IndexedDB API
  - 可在 Node.js 环境中运行

### 2.2 本地阶段（Local）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=local`
- Web环境：IndexedDB或者使用 fake-indexeddb

- 移动端：SQLite
- 特点：支持离线操作，数据持久化

### 2.3 生产阶段（Production）
- 环境配置：`NEXT_PUBLIC_DATABASE_ENV=production`
- 存储类型：混合存储（本地+云端）
- 云端选项：Firebase/Supabase
- 特点：多设备支持，数据同步

## 3. 数据同步策略

### 3.1 在线优先（Online-First）
- 适用场景：用户注册、个人资料更新
- 特点：优先云端操作，网络不可用时回退本地

### 3.2 离线优先（Offline-First）
- 适用场景：消息、匹配操作
- 特点：优先本地操作，后台同步云端

### 3.3 手动同步（Manual）
- 适用场景：批量数据同步、大文件传输
- 特点：用户主动触发，可控同步过程

### 3.4 离线存储（Offline-Only）
- 适用场景：本地笔记、草稿、设备特定设置
- 特点：数据仅存储在本地，永不同步到云端
- 配置：在表结构中添加 `syncConfig.offlineOnly: true`

```typescript
// 离线笔记表示例
const offlineNotesSchema: TableSchema = {
  name: 'offline_notes',
  syncConfig: {
    enabled: true,
    offlineOnly: true, // 标记为仅离线存储
    defaultPriority: SyncPriority.LOW,
    defaultConflictResolution: ConflictResolution.CLIENT_WINS
  },
  columns: [
    // 列定义...
  ]
};
```

## 4. 核心接口

### 4.1 基础客户端接口
```typescript
interface IBaseDatabaseClient {
  // 生命周期方法
  initialize(): Promise<void>;
  close(): Promise<void>;
  clear(): Promise<void>;
  
  // 通用数据访问接口
  findById<T>(tableName: string, id: string): Promise<T | null>;
  findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  create<T>(tableName: string, data: T): Promise<T>;
  update<T>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  delete(tableName: string, id: string): Promise<void>;
}
```

### 4.2 基础仓库接口
```typescript
abstract class BaseRepository<T extends { id: string }> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {}
  
  // 通用CRUD操作
  async findById(id: string): Promise<T | null>;
  async findAll(filter?: Record<string, any>): Promise<T[]>;
  async create(data: T): Promise<T>;
  async update(id: string, data: Partial<T>): Promise<void>;
  async delete(id: string): Promise<void>;
}
```

## 5. 数据库升级机制

### 5.1 版本管理
```typescript
interface DatabaseVersion {
  version: number;
  statements: string[];
}

export const databaseVersions: DatabaseVersion[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    ]
  },
  {
    version: 2,
    statements: [
      `ALTER TABLE users ADD COLUMN photoUrl TEXT;`,
      `ALTER TABLE users ADD COLUMN bio TEXT;`
    ]
  }
];
```

### 5.2 升级流程
1. 检查当前数据库版本
2. 执行升级语句
3. 更新版本号
4. 验证数据完整性

## 6. 平台特定实现

### 6.1 Web 平台 (IndexedDB)
- 使用 IndexedDB 作为主要存储
- 支持事务和索引
- 异步操作处理

### 6.2 移动平台 (SQLite)
- 使用 Capacitor SQLite 插件
- 原生性能优化
- 文件系统集成

### 6.3 混合存储策略
- 主存储选择
- 备份存储机制
- 数据同步协调

## 7. 错误处理与日志

### 7.1 错误处理策略
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 错误处理示例
try {
  await database.operation();
} catch (error) {
  if (error instanceof DatabaseError) {
    // 处理已知错误
  } else {
    // 处理未知错误
  }
}
```

### 7.2 日志记录
- 操作日志
- 错误日志
- 性能日志

## 8. 最佳实践

### 8.1 数据模型设计
```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  interests: string[];
  birthDate?: Date;
}
```

### 8.2 性能优化
- 批量操作支持
- 缓存策略
- 延迟加载

## 9. 开发流程

1. **环境设置**
   ```bash
   # 开发环境（Mock数据）
   bun run dev
   
   # 本地数据库环境
   bun run dev --env-file=.env.local
   
   # 生产环境
   bun run build
   bun run start
   ```

2. **添加新表**
   - 定义表结构
   - 创建仓库类
   - 实现同步逻辑

3. **测试验证**
   - 单元测试
   - 同步测试
   - 性能测试

## 10. 注意事项

1. **数据一致性**
   - 使用事务
   - 冲突解决
   - 数据备份

2. **性能考虑**
   - 合理索引
   - 数据分页
   - 查询优化

3. **安全性**
   - 数据加密
   - 访问控制
   - 安全审计

## 11. 常见问题

1. **离线数据同步**
   - 同步队列
   - 断点续传
   - 网络异常处理

2. **数据迁移**
   - 版本控制
   - 向后兼容
   - 数据验证

3. **性能优化**
   - 缓存策略
   - 批量操作
   - 延迟加载

## 12. 构建与部署

### 12.1 构建脚本
```json
{
  "scripts": {
    "build:web": "next build",
    "build:ios": "next build && npx cap sync ios",
    "build:android": "next build && npx cap sync android",
    "ios:start": "npm run build:ios && npx cap open ios",
    "android:start": "npm run build:android && npx cap open android"
  }
}
```

### 12.2 平台特定配置
- iOS 安全区域适配
- Android 权限管理
- Web 缓存策略



