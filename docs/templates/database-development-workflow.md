# 数据库开发工作流程

## 1. 概述

本文档描述了从开发到生产环境的数据库演进策略，包括Mock数据、本地数据库和生产环境数据库三个阶段。

## 2. 开发阶段

### 2.1 Mock数据阶段

#### 目的
- 快速开发和测试UI组件
- 验证业务逻辑
- 不依赖实际数据库环境

#### 实现方式
1. 在`src/mock/data/`目录下创建JSON格式的模拟数据
2. 实现Mock数据服务，提供与真实服务相同的接口
3. 在`.env.development`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=mock
   NEXT_PUBLIC_MOCK_DB_TYPE=memory  # 或 json
   ```

#### 验收标准
- [ ] Mock数据服务接口完整
- [ ] 数据结构符合设计规范
- [ ] 测试用例覆盖主要场景

### 2.2 本地数据库阶段

#### 目的
- 实现本地数据持久化
- 测试数据库操作性能
- 验证数据模型设计

#### 实现方式
1. 设计数据库Schema
2. 创建数据库迁移脚本
3. 实现本地数据库服务
4. 在`.env.local`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=local
   NEXT_PUBLIC_LOCAL_DB_TYPE=sqlite  # 或 indexeddb
   ```

#### 验收标准
- [ ] 数据库Schema设计合理
- [ ] 迁移脚本可重复执行
- [ ] CRUD操作性能达标

## 3. 生产环境阶段

### 3.1 云端数据库

#### 目的
- 实现数据云端存储
- 支持多用户访问
- 确保数据安全性

#### 实现方式
1. 选择云端数据库服务：
   - Firebase Realtime Database/Firestore
   - Supabase
   - Cloudflare D1

2. 在`.env.production`中配置：
   ```
   NEXT_PUBLIC_DATABASE_ENV=production
   NEXT_PUBLIC_CLOUD_DB_TYPE=supabase  # 或 firebase, cloudflare_d1
   NEXT_PUBLIC_CLOUD_DB_URL=your_db_url
   NEXT_PUBLIC_CLOUD_DB_KEY=your_db_key
   ```

3. 实现云端数据库服务：
   ```typescript
   // src/core/lib/db/cloud/cloud-database-service.ts
   export class CloudDatabaseService {
     constructor(private config: CloudConfig) {}
     
     async connect(): Promise<void> {
       // 实现数据库连接
     }
     
     async query<T>(sql: string, params: any[]): Promise<T[]> {
       // 实现查询操作
     }
     
     async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
       // 实现事务操作
     }
   }
   ```

#### 验收标准
- [ ] 数据库连接稳定可靠
- [ ] 查询性能满足要求
- [ ] 数据安全性符合标准

### 3.2 离线数据存储

#### 目的
- 支持离线数据访问
- 实现数据本地缓存
- 确保数据同步机制

#### 实现方式
1. 根据平台选择合适的存储方案：
   - 移动端：Capacitor SQLite
   - Web端：IndexedDB/LocalStorage

2. 在`.env.production`中配置：
   ```
   # 离线存储配置
   NEXT_PUBLIC_OFFLINE_STORAGE_TYPE=indexeddb  # 可选: capacitor-sqlite, indexeddb, localstorage, websql
   NEXT_PUBLIC_OFFLINE_STORAGE_NAME=app_db
   NEXT_PUBLIC_OFFLINE_STORAGE_VERSION=1
   ```

3. 实现离线存储服务：
   ```typescript
   // src/core/lib/db/offline/offline-database-service.ts
   export class OfflineDatabaseService {
     constructor(private config: OfflineConfig) {}
     
     async initialize(): Promise<void> {
       // 初始化数据库
     }
     
     async save<T>(key: string, data: T): Promise<void> {
       // 保存数据
     }
     
     async get<T>(key: string): Promise<T | null> {
       // 获取数据
     }
   }
   ```

#### 验收标准
- [ ] 离线数据访问正常
- [ ] 数据同步机制可靠
- [ ] 存储性能满足要求

### 3.3 数据同步服务

#### 目的
- 确保云端和本地数据一致性
- 处理数据冲突
- 优化同步性能

#### 实现方式
1. 实现数据同步服务：
   ```typescript
   // src/core/lib/db/sync/data-sync-service.ts
   export class DataSyncService {
     constructor(
       private cloudDb: CloudDatabaseService,
       private offlineDb: OfflineDatabaseService
     ) {}
     
     async sync(): Promise<void> {
       // 实现数据同步逻辑
     }
     
     async resolveConflict(local: any, remote: any): Promise<any> {
       // 实现冲突解决策略
     }
   }
   ```

2. 配置同步策略：
   - 定时同步
   - 网络恢复时同步
   - 手动触发同步

#### 验收标准
- [ ] 数据同步机制可靠
- [ ] 冲突解决策略合理
- [ ] 同步性能满足要求

## 4. 数据库工厂

### 4.1 工厂实现
```typescript
// src/core/lib/db/factory.ts
import { Capacitor } from '@capacitor/core'

export function createDatabaseClient(engine: DatabaseEngine) {
  // 移动端优先使用SQLite
  if (Capacitor.isNativePlatform() && engine === 'indexeddb') {
    engine = 'sqlite'
  }

  switch (engine) {
    case 'mock':
      return new MockDatabaseClient(process.env.MOCK_DB_TYPE)
    case 'indexeddb':
      return new IndexedDBClient(process.env.INDEXEDDB_NAME)
    case 'sqlite':
      return new SQLiteClient({
        encryptionKey: process.env.SQLITE_ENCRYPTION_KEY
      })
    case 'supabase':
      return new SupabaseClient({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      })
    // 其他数据库实现...
  }
}
```

### 4.2 使用示例
```typescript
// src/core/lib/db/index.ts
const db = createDatabaseClient(process.env.NEXT_PUBLIC_DATABASE_ENV)

export default db
```

## 5. 测试策略

### 5.1 单元测试
```typescript
// test/lib/db/mock-database.test.ts
describe('MockDatabase', () => {
  it('should handle CRUD operations', async () => {
    const db = createDatabaseClient('mock')
    // 测试CRUD操作
  })
})

// test/lib/db/local/sqlite.test.ts
describe('SQLiteDatabase', () => {
  it('should persist data', async () => {
    const db = createDatabaseClient('sqlite')
    // 测试数据持久化
  })
})
```

### 5.2 集成测试
```typescript
// test/lib/db/sync/data-sync.test.ts
describe('DataSync', () => {
  it('should sync data between cloud and offline storage', async () => {
    const cloudDb = createDatabaseClient('supabase')
    const offlineDb = createDatabaseClient('indexeddb')
    const syncService = new DataSyncService(cloudDb, offlineDb)
    // 测试数据同步
  })
})
```

## 6. 部署检查清单

### 6.1 云端数据库
- [ ] 创建数据库实例
- [ ] 配置安全规则
- [ ] 设置备份策略
- [ ] 验证连接配置

### 6.2 离线存储
- [ ] 选择存储方案
- [ ] 配置存储参数
- [ ] 测试离线功能
- [ ] 验证数据同步

### 6.3 性能优化
- [ ] 优化查询性能
- [ ] 实现数据缓存
- [ ] 配置连接池
- [ ] 监控数据库指标

## 7. 维护指南

### 7.1 日常维护
- 监控数据库性能
- 检查数据一致性
- 优化查询性能
- 更新数据库配置

### 7.2 问题处理
- 诊断连接问题
- 修复数据错误
- 处理同步冲突
- 优化存储空间

## 8. 安全考虑

### 8.1 数据安全
- 加密敏感数据
- 实现访问控制
- 定期数据备份
- 监控异常访问

### 8.2 应用安全
- 验证用户输入
- 防止SQL注入
- 实现请求限流
- 记录安全日志