# 数据库客户端标准化模板

此模板提供了实现一个标准化数据库客户端的基本结构和要求。开发者可以使用此模板作为起点，确保所有客户端实现保持一致。

## 目录结构

```
src/core/lib/db/clients/<client-type>/
├── index.ts                    # 导出文件
├── <client-type>-client.ts     # 主客户端文件
├── <client-type>-config.ts     # 配置接口定义（可选，也可以在主文件中定义）
├── README.md                   # 客户端文档
└── tests/                      # 测试文件目录
    └── <client-type>-client.test.ts
```

## 客户端类实现示例

以下是一个标准化数据库客户端实现的基本结构：

```typescript
// <client-type>-client.ts
import { BaseClient } from '../../base-client';
import { IDatabaseClient } from '../../../interfaces/database-client.interface';
import { DatabaseError, DatabaseErrorCode } from '../../../errors/database-error';
import { DatabaseLogger } from '../../../utils/database-logger';
import { 
  DatabaseConfig, 
  Entity, 
  FilterCondition, 
  QueryOptions, 
  QueryResult 
} from '../../../types/database.types';

/**
 * <ClientType>配置接口
 * @extends DatabaseConfig 基础数据库配置
 */
export interface <ClientType>Config extends DatabaseConfig {
  // 客户端特定配置项
  specificOption1?: string;
  specificOption2?: boolean;
}

/**
 * <ClientType>客户端实现
 * 
 * [客户端简要描述，包括用途和主要特点]
 * 
 * @extends BaseClient 数据库客户端基类
 * @implements IDatabaseClient 数据库客户端接口
 */
export class <ClientType>Client extends BaseClient implements IDatabaseClient {
  private logger = new DatabaseLogger('<ClientType>Client');
  private config: <ClientType>Config;
  // 其他客户端特定私有变量

  /**
   * 创建<ClientType>客户端实例
   * @param config - 客户端配置
   */
  constructor(config: <ClientType>Config) {
    super();
    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };
    this.logger.info('客户端实例已创建');
  }

  /**
   * 获取默认配置
   * @returns 默认配置对象
   */
  private getDefaultConfig(): <ClientType>Config {
    return {
      // 默认配置值
    };
  }

  /**
   * 初始化客户端
   * @throws DatabaseError 初始化失败时抛出
   */
  public async initialize(): Promise<void> {
    try {
      this.checkNotInitialized();
      
      // 初始化逻辑
      
      this._initialized = true;
      this.emitEvent('initialized', {});
      this.logger.info('客户端已初始化');
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.INITIALIZATION_FAILED,
        '初始化失败',
        error
      );
      this.logger.error('初始化失败', dbError);
      throw dbError;
    }
  }

  /**
   * 关闭客户端连接
   */
  public async close(): Promise<void> {
    try {
      this.checkInitialized();
      
      // 关闭逻辑
      
      this._initialized = false;
      this.emitEvent('closed', {});
      this.logger.info('客户端已关闭');
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.CLOSE_FAILED,
        '关闭失败',
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
        
        // findById实现
        
        return null; // 替换为实际实现
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

  /**
   * 查找所有匹配条件的实体
   * @param table - 表名
   * @param conditions - 过滤条件
   * @returns 匹配的实体数组
   * @throws DatabaseError 查询失败时抛出
   */
  public async findAll<T extends Entity>(
    table: string, 
    conditions?: FilterCondition
  ): Promise<T[]> {
    return this.measurePerformance('findAll', async () => {
      try {
        this.checkInitialized();
        
        // findAll实现
        
        return []; // 替换为实际实现
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.FIND_FAILED,
          `查找所有实体失败: 表=${table}`,
          error
        );
        this.logger.error(`查找所有实体失败`, dbError);
        throw dbError;
      }
    });
  }

  /**
   * 执行高级查询
   * @param table - 表名
   * @param options - 查询选项
   * @returns 查询结果
   * @throws DatabaseError 查询失败时抛出
   */
  public async query<T extends Entity>(
    table: string, 
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    return this.measurePerformance('query', async () => {
      try {
        this.checkInitialized();
        
        // query实现
        
        return {
          data: [],
          total: 0,
          page: options.page || 1,
          pageSize: options.pageSize || 10
        }; // 替换为实际实现
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.QUERY_FAILED,
          `查询失败: 表=${table}`,
          error
        );
        this.logger.error(`查询失败`, dbError);
        throw dbError;
      }
    });
  }

  /**
   * 创建实体
   * @param table - 表名
   * @param data - 实体数据
   * @returns 创建的实体
   * @throws DatabaseError 创建失败时抛出
   */
  public async create<T extends Entity>(table: string, data: Omit<T, 'id'>): Promise<T> {
    return this.measurePerformance('create', async () => {
      try {
        this.checkInitialized();
        
        // create实现
        
        return {} as T; // 替换为实际实现
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.CREATE_FAILED,
          `创建实体失败: 表=${table}`,
          error
        );
        this.logger.error(`创建实体失败`, dbError);
        throw dbError;
      }
    });
  }

  /**
   * 更新实体
   * @param table - 表名
   * @param id - 实体ID
   * @param data - 更新数据
   * @returns 更新后的实体
   * @throws DatabaseError 更新失败时抛出
   */
  public async update<T extends Entity>(
    table: string, 
    id: string, 
    data: Partial<Omit<T, 'id'>>
  ): Promise<T> {
    return this.measurePerformance('update', async () => {
      try {
        this.checkInitialized();
        
        // update实现
        
        return {} as T; // 替换为实际实现
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.UPDATE_FAILED,
          `更新实体失败: 表=${table}, ID=${id}`,
          error
        );
        this.logger.error(`更新实体失败`, dbError);
        throw dbError;
      }
    });
  }

  /**
   * 删除实体
   * @param table - 表名
   * @param id - 实体ID
   * @returns 是否成功删除
   * @throws DatabaseError 删除失败时抛出
   */
  public async delete(table: string, id: string): Promise<boolean> {
    return this.measurePerformance('delete', async () => {
      try {
        this.checkInitialized();
        
        // delete实现
        
        return true; // 替换为实际实现
      } catch (error) {
        const dbError = this.createError(
          DatabaseErrorCode.DELETE_FAILED,
          `删除实体失败: 表=${table}, ID=${id}`,
          error
        );
        this.logger.error(`删除实体失败`, dbError);
        throw dbError;
      }
    });
  }

  /**
   * 开始事务
   * @returns 事务ID
   * @throws DatabaseError 事务开始失败时抛出
   */
  public async beginTransaction(): Promise<string> {
    try {
      this.checkInitialized();
      
      // beginTransaction实现
      
      return ''; // 替换为实际实现
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
      
      // commitTransaction实现
      
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
      
      // rollbackTransaction实现
      
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
      clientType: '<ClientType>',
      cause: cause as Error,
      context: {
        clientConfig: this.config
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
        clientType: '<ClientType>'
      });
      this.logger.debug(`操作 ${operation} 耗时 ${duration}ms`);
    }
  }
}
```

## index.ts 示例

```typescript
// index.ts
export * from './<client-type>-client';
// 导出其他相关类型和工具（如适用）
```

## README.md 模板

```markdown
# <ClientType> 数据库客户端

## 概述

[简要描述客户端的主要功能和使用场景]

## 特性

- [特性1]
- [特性2]
- [特性3]

## 安装

确保项目中已安装相关依赖：

```bash
npm install --save [相关依赖包]
```

## 配置

<ClientType>客户端支持以下配置选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| 选项1 | string | '' | 选项1的说明 |
| 选项2 | boolean | false | 选项2的说明 |

## 使用示例

### 基本用法

```typescript
import { <ClientType>Client } from '@core/lib/db/clients/<client-type>';

const client = new <ClientType>Client({
  // 配置选项
});

await client.initialize();

// 创建实体
const newUser = await client.create('users', {
  name: '张三',
  email: 'zhangsan@example.com'
});

// 查询实体
const user = await client.findById('users', newUser.id);

// 更新实体
await client.update('users', user.id, {
  name: '张三（已更新）'
});

// 删除实体
await client.delete('users', user.id);

// 关闭客户端
await client.close();
```

### 事务示例

```typescript
import { <ClientType>Client } from '@core/lib/db/clients/<client-type>';

const client = new <ClientType>Client({
  // 配置选项
});

await client.initialize();

// 使用事务
const transactionId = await client.beginTransaction();
try {
  const user = await client.create('users', {
    name: '李四',
    email: 'lisi@example.com'
  });
  
  await client.create('profiles', {
    userId: user.id,
    bio: '个人简介'
  });
  
  await client.commitTransaction(transactionId);
} catch (error) {
  await client.rollbackTransaction(transactionId);
  throw error;
}
```

## 最佳实践

- [最佳实践1]
- [最佳实践2]
- [最佳实践3]

## 限制和注意事项

- [限制1]
- [限制2]
- [限制3]
```

## 测试模板

```typescript
// <client-type>-client.test.ts
import { <ClientType>Client } from '../<client-type>-client';

describe('<ClientType>Client', () => {
  let client: <ClientType>Client;

  beforeEach(async () => {
    client = new <ClientType>Client({
      // 测试配置
    });
    await client.initialize();
  });

  afterEach(async () => {
    await client.close();
  });

  describe('基本CRUD操作', () => {
    test('应能创建和检索实体', async () => {
      // 测试代码
    });

    test('应能更新实体', async () => {
      // 测试代码
    });

    test('应能删除实体', async () => {
      // 测试代码
    });
  });

  describe('查询功能', () => {
    test('应能按条件查找实体', async () => {
      // 测试代码
    });

    test('应能执行分页查询', async () => {
      // 测试代码
    });
  });

  describe('事务支持', () => {
    test('应能在事务中执行多个操作', async () => {
      // 测试代码
    });

    test('应能回滚失败的事务', async () => {
      // 测试代码
    });
  });

  describe('错误处理', () => {
    test('应能正确处理不存在的实体', async () => {
      // 测试代码
    });

    test('应能处理无效输入', async () => {
      // 测试代码
    });
  });
});
```

## 注意事项

1. 始终保持错误处理的一致性，使用`DatabaseError`类表示所有错误
2. 所有公共方法都应有详细的JSDoc注释
3. 记录操作日志和性能指标
4. 确保所有操作都先检查客户端是否已初始化
5. 实现可配置的性能监控和缓存机制
6. 提供详细的使用文档和示例代码 