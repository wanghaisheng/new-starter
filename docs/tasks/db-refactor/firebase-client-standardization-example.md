# Firebase 客户端标准化示例

本文档提供 Firebase 客户端标准化的具体示例，作为其他客户端实现的参考。

## 目录结构

首先，确保 Firebase 客户端目录结构遵循标准化模式：

```
src/core/lib/db/clients/firebase/
├── index.ts                   # 导出文件
├── firebase-client.ts         # 主客户端实现
├── firebase-helpers/          # 辅助功能目录
│   ├── realtime-listener.ts   # 实时监听辅助类
│   ├── offline-manager.ts     # 离线模式管理
│   └── query-builder.ts       # Firebase查询构建器
├── README.md                  # 客户端文档
└── tests/                     # 测试文件目录
    └── firebase-client.test.ts
```

## 客户端配置接口

```typescript
// firebase-client.ts (部分)
import { DatabaseConfig } from '../../../types/database.types';

/**
 * Firebase客户端配置接口
 * @extends DatabaseConfig 基础数据库配置
 */
export interface FirebaseConfig extends DatabaseConfig {
  /**
   * Firebase项目ID
   */
  projectId: string;
  
  /**
   * 数据库实例URL
   */
  databaseURL?: string;
  
  /**
   * 是否启用离线模式
   * @default true
   */
  enableOfflineMode?: boolean;
  
  /**
   * 查询缓存时间（毫秒）
   * @default 60000
   */
  queryCacheDuration?: number;
  
  /**
   * 网络超时时间（毫秒）
   * @default 15000
   */
  networkTimeout?: number;
  
  /**
   * 是否自动重连
   * @default true
   */
  autoReconnect?: boolean;
}
```

## 客户端实现示例

下面是 Firebase 客户端的关键部分实现示例：

```typescript
// firebase-client.ts
import { BaseClient } from '../../base-client';
import { IDatabaseClient } from '../../../interfaces/database-client.interface';
import { DatabaseError, DatabaseErrorCode } from '../../../errors/database-error';
import { DatabaseLogger } from '../../../utils/database-logger';
import { 
  Entity, 
  FilterCondition, 
  QueryOptions, 
  QueryResult 
} from '../../../types/database.types';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { 
  Database, 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  query, 
  orderByChild, 
  startAt, 
  endAt, 
  limitToFirst, 
  DatabaseReference, 
  runTransaction 
} from 'firebase/database';
import { RealtimeListener } from './firebase-helpers/realtime-listener';
import { OfflineManager } from './firebase-helpers/offline-manager';
import { QueryBuilder } from './firebase-helpers/query-builder';

/**
 * Firebase 数据库客户端
 * 
 * 提供与 Firebase Realtime Database 交互的标准化接口，支持离线模式和实时数据同步。
 * 
 * @extends BaseClient 数据库客户端基类
 * @implements IDatabaseClient 数据库客户端接口
 */
export class FirebaseClient extends BaseClient implements IDatabaseClient {
  private logger = new DatabaseLogger('FirebaseClient');
  private config: FirebaseConfig;
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private queryBuilder: QueryBuilder | null = null;
  private offlineManager: OfflineManager | null = null;
  private activeTransactions: Map<string, DatabaseReference> = new Map();
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  
  /**
   * 创建Firebase客户端实例
   * @param config - Firebase客户端配置
   */
  constructor(config: FirebaseConfig) {
    super();
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
    this.logger.info('Firebase客户端实例已创建');
  }
  
  /**
   * 获取默认配置
   * @returns 默认配置对象
   */
  private getDefaultConfig(): FirebaseConfig {
    return {
      projectId: '',
      enableOfflineMode: true,
      queryCacheDuration: 60000,
      networkTimeout: 15000,
      autoReconnect: true
    };
  }
  
  /**
   * 初始化Firebase客户端
   * @throws DatabaseError 初始化失败时抛出
   */
  public async initialize(): Promise<void> {
    try {
      this.checkNotInitialized();
      
      if (!this.config.projectId) {
        throw new Error('Firebase项目ID不能为空');
      }
      
      // 初始化Firebase应用
      this.app = initializeApp({
        projectId: this.config.projectId,
        databaseURL: this.config.databaseURL || `https://${this.config.projectId}.firebaseio.com`
      });
      
      // 获取数据库实例
      this.db = getDatabase(this.app);
      
      // 初始化辅助组件
      this.queryBuilder = new QueryBuilder(this.db);
      
      if (this.config.enableOfflineMode) {
        this.offlineManager = new OfflineManager(this.db, {
          autoReconnect: this.config.autoReconnect
        });
        await this.offlineManager.initialize();
      }
      
      this._initialized = true;
      this.emitEvent('initialized', {});
      this.logger.info('Firebase客户端已初始化');
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.INITIALIZATION_FAILED,
        'Firebase客户端初始化失败',
        error
      );
      this.logger.error('初始化失败', dbError);
      throw dbError;
    }
  }
  
  /**
   * 关闭Firebase客户端连接
   */
  public async close(): Promise<void> {
    try {
      this.checkInitialized();
      
      // 清理事务
      this.activeTransactions.clear();
      
      // 清理缓存
      this.queryCache.clear();
      
      // 关闭离线管理器
      if (this.offlineManager) {
        await this.offlineManager.close();
      }
      
      this._initialized = false;
      this.emitEvent('closed', {});
      this.logger.info('Firebase客户端已关闭');
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.CLOSE_FAILED,
        'Firebase客户端关闭失败',
        error
      );
      this.logger.error('关闭失败', dbError);
      throw dbError;
    }
  }
  
  /**
   * 通过ID查找实体
   * @param table - 表名
   * @param id - 实体ID
   * @returns 找到的实体或null
   * @throws DatabaseError 查询失败时抛出
   */
  public async findById<T extends Entity>(table: string, id: string): Promise<T | null> {
    return this.measurePerformance('findById', async () => {
      try {
        this.checkInitialized();
        
        if (!this.db) {
          throw new Error('数据库实例未初始化');
        }
        
        const entityRef = ref(this.db, `${table}/${id}`);
        const snapshot = await get(entityRef);
        
        if (!snapshot.exists()) {
          return null;
        }
        
        const data = snapshot.val();
        return {
          id,
          ...data
        } as T;
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.FIND_FAILED,
          `查找实体失败: 表=${table}, ID=${id}`,
          error
        );
        this.logger.error(`查找实体失败`, dbError);
        throw dbError;
      }
    });
  }
  
  // 其他方法的实现...
  
  /**
   * 开始事务
   * @returns 事务ID
   * @throws DatabaseError 事务开始失败时抛出
   */
  public async beginTransaction(): Promise<string> {
    try {
      this.checkInitialized();
      
      if (!this.db) {
        throw new Error('数据库实例未初始化');
      }
      
      // 生成唯一事务ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // 创建事务引用
      const transactionRef = ref(this.db, `__transactions/${transactionId}`);
      this.activeTransactions.set(transactionId, transactionRef);
      
      // 初始化事务状态
      await set(transactionRef, {
        status: 'active',
        startTime: Date.now(),
        operations: []
      });
      
      this.logger.debug(`事务已开始: ID=${transactionId}`);
      return transactionId;
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.TRANSACTION_FAILED,
        '开始事务失败',
        error
      );
      this.logger.error('开始事务失败', dbError);
      throw dbError;
    }
  }
  
  /**
   * 提交事务
   * @param transactionId - 事务ID
   * @throws DatabaseError 事务提交失败时抛出
   */
  public async commitTransaction(transactionId: string): Promise<void> {
    try {
      this.checkInitialized();
      
      if (!this.db) {
        throw new Error('数据库实例未初始化');
      }
      
      const transactionRef = this.activeTransactions.get(transactionId);
      if (!transactionRef) {
        throw new Error(`事务不存在或已完成: ID=${transactionId}`);
      }
      
      // 更新事务状态
      await update(transactionRef, {
        status: 'committed',
        commitTime: Date.now()
      });
      
      // 清理事务引用
      this.activeTransactions.delete(transactionId);
      
      this.logger.debug(`事务已提交: ID=${transactionId}`);
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.TRANSACTION_FAILED,
        `提交事务失败: ID=${transactionId}`,
        error
      );
      this.logger.error('提交事务失败', dbError);
      throw dbError;
    }
  }
  
  /**
   * 回滚事务
   * @param transactionId - 事务ID
   * @throws DatabaseError 事务回滚失败时抛出
   */
  public async rollbackTransaction(transactionId: string): Promise<void> {
    try {
      this.checkInitialized();
      
      if (!this.db) {
        throw new Error('数据库实例未初始化');
      }
      
      const transactionRef = this.activeTransactions.get(transactionId);
      if (!transactionRef) {
        throw new Error(`事务不存在或已完成: ID=${transactionId}`);
      }
      
      // 获取事务操作记录
      const snapshot = await get(transactionRef);
      if (!snapshot.exists()) {
        throw new Error(`事务数据不存在: ID=${transactionId}`);
      }
      
      const transactionData = snapshot.val();
      
      // 回滚操作逻辑
      // 需要实现回滚每个记录的操作
      // ...
      
      // 更新事务状态
      await update(transactionRef, {
        status: 'rolledBack',
        rollbackTime: Date.now()
      });
      
      // 清理事务引用
      this.activeTransactions.delete(transactionId);
      
      this.logger.debug(`事务已回滚: ID=${transactionId}`);
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.TRANSACTION_FAILED,
        `回滚事务失败: ID=${transactionId}`,
        error
      );
      this.logger.error('回滚事务失败', dbError);
      throw dbError;
    }
  }
  
  /**
   * 创建标准化错误
   * @param code - 错误代码
   * @param message - 错误消息
   * @param cause - 原始错误
   * @returns 标准化数据库错误
   */
  private createError(
    code: DatabaseErrorCode,
    message: string,
    cause?: unknown
  ): DatabaseError {
    return new DatabaseError({
      code,
      message,
      clientType: 'Firebase',
      cause: cause as Error,
      context: {
        projectId: this.config.projectId,
        enableOfflineMode: this.config.enableOfflineMode
      }
    });
  }
  
  /**
   * 性能测量包装器
   * @param operation - 操作名称
   * @param fn - 要测量的异步函数
   * @returns 函数的返回值
   */
  private async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - startTime;
      this.emitEvent('performance', {
        operation,
        duration,
        clientType: 'Firebase'
      });
      this.logger.debug(`操作 ${operation} 耗时 ${duration}ms`);
    }
  }
  
  // Firebase特有方法 - 实时监听
  /**
   * 添加实时数据监听
   * @param table - 表名
   * @param id - 实体ID
   * @param callback - 数据变化回调函数
   * @returns 监听器ID
   */
  public async addRealtimeListener<T extends Entity>(
    table: string,
    id: string,
    callback: (data: T | null) => void
  ): Promise<string> {
    try {
      this.checkInitialized();
      
      if (!this.db) {
        throw new Error('数据库实例未初始化');
      }
      
      if (!this.queryBuilder) {
        throw new Error('查询构建器未初始化');
      }
      
      const listener = new RealtimeListener(this.db);
      const listenerId = await listener.addEntityListener(table, id, callback);
      
      return listenerId;
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `添加实时监听失败: 表=${table}, ID=${id}`,
        error
      );
      this.logger.error(`添加实时监听失败`, dbError);
      throw dbError;
    }
  }
  
  /**
   * 移除实时数据监听
   * @param listenerId - 监听器ID
   */
  public async removeRealtimeListener(listenerId: string): Promise<void> {
    try {
      this.checkInitialized();
      
      if (!this.db) {
        throw new Error('数据库实例未初始化');
      }
      
      const listener = new RealtimeListener(this.db);
      await listener.removeListener(listenerId);
      
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `移除实时监听失败: ID=${listenerId}`,
        error
      );
      this.logger.error(`移除实时监听失败`, dbError);
      throw dbError;
    }
  }
}
```

## 辅助类示例

以下是一个辅助类的示例，用于实现 Firebase 特有的实时监听功能：

```typescript
// firebase-helpers/realtime-listener.ts
import { 
  Database, 
  ref, 
  onValue, 
  off, 
  DataSnapshot, 
  DatabaseReference 
} from 'firebase/database';

/**
 * Firebase实时监听器
 * 管理对Firebase Realtime Database的实时数据订阅
 */
export class RealtimeListener {
  private db: Database;
  private listeners: Map<string, { reference: DatabaseReference; callback: Function }> = new Map();
  
  /**
   * 创建实时监听器实例
   * @param db - Firebase数据库实例
   */
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * 添加实体监听器
   * @param table - 表名
   * @param id - 实体ID
   * @param callback - 数据变化回调函数
   * @returns 监听器ID
   */
  public addEntityListener<T>(
    table: string,
    id: string,
    callback: (data: T | null) => void
  ): string {
    const entityRef = ref(this.db, `${table}/${id}`);
    const listenerId = `${table}_${id}_${Date.now()}`;
    
    // 设置监听
    onValue(entityRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      
      const data = snapshot.val();
      callback({
        id,
        ...data
      } as T);
    });
    
    // 保存监听引用
    this.listeners.set(listenerId, {
      reference: entityRef,
      callback
    });
    
    return listenerId;
  }
  
  /**
   * 添加查询监听器
   * @param table - 表名
   * @param queryRef - 查询引用
   * @param callback - 数据变化回调函数
   * @returns 监听器ID
   */
  public addQueryListener<T>(
    table: string,
    queryRef: DatabaseReference,
    callback: (data: T[]) => void
  ): string {
    const listenerId = `${table}_query_${Date.now()}`;
    
    // 设置监听
    onValue(queryRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const results: T[] = [];
      snapshot.forEach((childSnapshot) => {
        const id = childSnapshot.key;
        const data = childSnapshot.val();
        
        if (id) {
          results.push({
            id,
            ...data
          } as T);
        }
        
        return false; // 继续遍历
      });
      
      callback(results);
    });
    
    // 保存监听引用
    this.listeners.set(listenerId, {
      reference: queryRef,
      callback
    });
    
    return listenerId;
  }
  
  /**
   * 移除监听器
   * @param listenerId - 监听器ID
   */
  public removeListener(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (!listener) {
      return;
    }
    
    // 移除监听
    off(listener.reference);
    
    // 清理引用
    this.listeners.delete(listenerId);
  }
  
  /**
   * 移除所有监听器
   */
  public removeAllListeners(): void {
    for (const [listenerId, listener] of this.listeners.entries()) {
      off(listener.reference);
      this.listeners.delete(listenerId);
    }
  }
}
```

## index.ts 文件示例

```typescript
// index.ts
export * from './firebase-client';
export * from './firebase-helpers/realtime-listener';
export * from './firebase-helpers/offline-manager';
export * from './firebase-helpers/query-builder';

// 导出类型
export type { FirebaseConfig } from './firebase-client';
```

## README.md 文件示例

```markdown
# Firebase 数据库客户端

## 概述

Firebase 数据库客户端提供与 Firebase Realtime Database 交互的标准化接口，支持 CRUD 操作、查询、事务处理，以及 Firebase 特有的实时数据同步和离线模式。

## 特性

- 完全符合 `IDatabaseClient` 接口规范
- 实时数据同步（实时订阅数据变更）
- 支持离线模式（断网后可正常操作，自动同步）
- 事务支持（保证多操作原子性）
- 性能监控和优化
- 完善的错误处理和日志记录

## 安装

确保项目中已安装相关依赖：

```bash
npm install --save firebase
```

## 配置

Firebase 客户端支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| projectId | string | 必填 | Firebase项目ID |
| databaseURL | string | 自动生成 | 数据库实例URL |
| enableOfflineMode | boolean | true | 是否启用离线模式 |
| queryCacheDuration | number | 60000 | 查询缓存时间（毫秒） |
| networkTimeout | number | 15000 | 网络超时时间（毫秒） |
| autoReconnect | boolean | true | 是否自动重连 |

## 使用示例

### 基本用法

```typescript
import { FirebaseClient } from '@core/lib/db/clients/firebase';

const client = new FirebaseClient({
  projectId: 'your-project-id'
});

await client.initialize();

// 创建用户
const newUser = await client.create('users', {
  name: '张三',
  email: 'zhangsan@example.com',
  createdAt: new Date()
});

// 查询用户
const user = await client.findById('users', newUser.id);

// 更新用户
await client.update('users', user.id, {
  name: '张三（已更新）'
});

// 删除用户
await client.delete('users', user.id);

// 关闭客户端
await client.close();
```

### 实时数据监听

```typescript
import { FirebaseClient } from '@core/lib/db/clients/firebase';

const client = new FirebaseClient({
  projectId: 'your-project-id'
});

await client.initialize();

// 添加实时监听
const listenerId = await client.addRealtimeListener('users', 'user-123', (userData) => {
  if (userData) {
    console.log('用户数据已更新:', userData);
  } else {
    console.log('用户已删除');
  }
});

// ... 一段时间后

// 移除监听
await client.removeRealtimeListener(listenerId);
```

### 事务示例

```typescript
import { FirebaseClient } from '@core/lib/db/clients/firebase';

const client = new FirebaseClient({
  projectId: 'your-project-id'
});

await client.initialize();

// 使用事务
const transactionId = await client.beginTransaction();
try {
  const user = await client.create('users', {
    name: '李四',
    balance: 100
  });
  
  const order = await client.create('orders', {
    userId: user.id,
    amount: 50,
    status: 'pending'
  });
  
  // 更新用户余额
  await client.update('users', user.id, {
    balance: 50
  });
  
  // 更新订单状态
  await client.update('orders', order.id, {
    status: 'completed'
  });
  
  await client.commitTransaction(transactionId);
} catch (error) {
  await client.rollbackTransaction(transactionId);
  throw error;
}
```

## 最佳实践

- 使用实时监听而非轮询来获取数据变更
- 在移动应用中启用离线模式，提高用户体验
- 利用事务确保关联操作的原子性
- 避免过度使用深层嵌套的数据结构
- 合理设置缓存时间，优化性能和数据新鲜度的平衡

## 限制和注意事项

- 嵌套事务不被原生支持，需小心使用
- 实时监听会增加带宽和电池消耗，合理使用
- Firebase有数据结构深度限制，避免过深的嵌套
- 大型数据集可能遇到性能瓶颈，考虑分页和筛选
```

## 实施步骤

完成 Firebase 客户端的标准化可按照以下步骤进行：

1. **分析当前实现**：
   - 检查现有 Firebase 客户端代码
   - 识别偏离标准的地方
   - 确定需要保留的特殊功能

2. **重构目录结构**：
   - 创建标准化的文件结构
   - 将特殊功能抽离到辅助类中

3. **标准化主客户端类**：
   - 确保继承 `BaseClient` 并实现 `IDatabaseClient`
   - 实现标准化的错误处理和日志记录
   - 添加性能监控

4. **实现 Firebase 特有功能**：
   - 实现实时监听功能
   - 实现离线模式支持
   - 确保这些功能不影响标准接口

5. **编写文档和测试**：
   - 创建详细的 README.md
   - 编写单元测试和集成测试

6. **检查一致性**：
   - 使用一致性检查清单验证实现
   - 修复发现的问题

通过遵循这些步骤，可以确保 Firebase 客户端实现符合项目的标准化要求，同时保留其特有功能。 