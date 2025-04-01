import { BaseClient } from '../base-client';
import { User, Match, Message } from '../../types';
import { IDatabaseClient, DatabaseConfig, IDatabaseTransaction } from '../../interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { BaseEntity } from '../../types/base-entity';
import { DatabaseError, DatabaseErrorCode } from '../../errors/database-error';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock数据库客户端配置接口
 */
export interface MockDatabaseConfig extends DatabaseConfig {
  /**
   * 数据源模式: 'memory' | 'json'
   * - memory: 使用内存中预定义的数据
   * - json: 从JSON文件加载数据
   * @default 'memory'
   */
  mockMode?: 'memory' | 'json';

  /**
   * JSON文件路径（当mockMode为'json'时使用）
   * 如果提供相对路径，将相对于当前工作目录解析
   */
  jsonFilePath?: string;

  /**
   * 是否自动保存对JSON文件的更改
   * 仅在mockMode为'json'时适用
   * @default false
   */
  autoSave?: boolean;
}

/**
 * 模拟数据库客户端
 * 用于测试和开发环境
 * 支持内存模式和JSON文件模式
 */
export class MockDatabaseClient extends BaseClient implements IDatabaseClient {
  private data: {
    users: Map<string, User>;
    matches: Map<string, Match>;
    messages: Map<string, Message>;
    [key: string]: Map<string, any>;
  };

  private mockConfig: Required<Pick<MockDatabaseConfig, 'mockMode' | 'jsonFilePath' | 'autoSave'>>;

  /**
   * 构造函数
   * @param config 数据库配置
   */
  constructor(private config: MockDatabaseConfig) {
    super();
    
    // 设置默认Mock配置
    this.mockConfig = {
      mockMode: config.mockMode || 'memory',
      jsonFilePath: config.jsonFilePath || './mock-data.json',
      autoSave: config.autoSave || false
    };
    
    this.data = {
    users: new Map(),
    matches: new Map(),
    messages: new Map(),
  };

    // 记录配置信息
    this.logger.debug('MockDatabaseClient配置', {
      mockMode: this.mockConfig.mockMode,
      jsonFilePath: this.mockConfig.jsonFilePath,
      autoSave: this.mockConfig.autoSave
    });
  }

  /**
   * 初始化模拟数据
   * 根据配置的mockMode决定是加载内存数据还是JSON文件数据
   */
  private async initializeMockData(): Promise<void> {
    if (this.mockConfig.mockMode === 'json') {
      await this.loadDataFromJson();
    } else {
      this.initializeMemoryData();
    }
  }

  /**
   * 初始化内存中的模拟数据
   */
  private initializeMemoryData(): void {
    // 添加一些测试用户
    const now = new Date();
    const testUsers: User[] = [
      {
        id: '1',
        name: 'test_user1',
        bio: 'Test user 1',
        birthDate: new Date(2000, 0, 1), // 2000-01-01
        gender: 'male',
        interests: ['music', 'travel'],
        photos: [],
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          city: 'New York',
          country: 'USA'
        },
        preferences: {
          ageRange: { min: 18, max: 35 },
          distance: 50,
          gender: ['female'],
          interests: ['music', 'travel']
        },
        isVerified: true,
        lastActive: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '2',
        name: 'test_user2',
        bio: 'Test user 2',
        birthDate: new Date(1998, 5, 15), // 1998-06-15
        gender: 'female',
        interests: ['sports', 'movies'],
        photos: [],
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          city: 'Los Angeles',
          country: 'USA'
        },
        preferences: {
          ageRange: { min: 20, max: 40 },
          distance: 30,
          gender: ['male'],
          interests: ['sports', 'movies']
        },
        isVerified: true,
        lastActive: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ];

    testUsers.forEach(user => this.data.users.set(user.id, user));
    this.logger.info('已初始化内存模式的模拟数据');
  }

  /**
   * 从JSON文件加载数据
   */
  private async loadDataFromJson(): Promise<void> {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(this.mockConfig.jsonFilePath)) {
        this.logger.warn(`JSON文件不存在: ${this.mockConfig.jsonFilePath}，将创建一个新文件`);
        // 初始化空数据并保存
        this.initializeMemoryData();
        await this.saveDataToJson();
        return;
      }

      // 读取JSON文件
      const fileContent = fs.readFileSync(this.mockConfig.jsonFilePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // 清空现有数据
      Object.keys(this.data).forEach(key => {
        this.data[key].clear();
      });

      // 加载数据到Map中
      Object.entries(jsonData).forEach(([tableName, tableData]) => {
        if (!this.data[tableName]) {
          this.data[tableName] = new Map();
        }
        
        // 将数组数据转换为Map
        if (Array.isArray(tableData)) {
          tableData.forEach((item: any) => {
            if (item && item.id) {
              // 处理日期字段
              this.convertJsonDates(item);
              this.data[tableName].set(item.id, item);
            }
          });
        }
      });

      this.logger.info(`已从JSON文件加载数据: ${this.mockConfig.jsonFilePath}`);
    } catch (error) {
      this.logger.error(`从JSON文件加载数据失败: ${this.mockConfig.jsonFilePath}`, error);
      throw this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR, 
        `加载JSON数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 保存数据到JSON文件
   */
  private async saveDataToJson(): Promise<void> {
    try {
      // 创建要保存的数据对象
      const jsonData: Record<string, any[]> = {};

      // 将Map数据转换为数组
      Object.entries(this.data).forEach(([tableName, tableData]) => {
        jsonData[tableName] = Array.from(tableData.values());
      });

      // 确保目录存在
      const dirPath = path.dirname(this.mockConfig.jsonFilePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 写入JSON文件
      fs.writeFileSync(
        this.mockConfig.jsonFilePath, 
        JSON.stringify(jsonData, null, 2), 
        'utf8'
      );

      this.logger.info(`已保存数据到JSON文件: ${this.mockConfig.jsonFilePath}`);
    } catch (error) {
      this.logger.error(`保存数据到JSON文件失败: ${this.mockConfig.jsonFilePath}`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED, 
        `保存JSON数据失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 处理JSON日期字符串转换为Date对象
   * @param obj 要处理的对象
   */
  private convertJsonDates(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // 检查是否是日期字符串
        if (typeof value === 'string') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/;
          if (dateRegex.test(value)) {
            obj[key] = new Date(value);
          }
        } 
        // 递归处理嵌套对象
        else if (value && typeof value === 'object') {
          this.convertJsonDates(value);
        }
      }
    }
  }

  /**
   * 获取指定表的数据
   * @param tableName 表名
   * @returns 表数据的 Map 对象
   * @throws {DatabaseError} 如果表不存在
   */
  private getTable(tableName: string): Map<string, any> {
    if (!this.data[tableName]) {
      this.data[tableName] = new Map();
    }
    return this.data[tableName];
  }

  /**
   * 检查记录是否匹配指定的过滤条件
   * @param item 记录
   * @param filter 过滤条件
   * @returns 是否匹配
   */
  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      // 处理特殊操作符
      if (key === '$or' && Array.isArray(value)) {
        return value.some((subFilter: Record<string, any>) => 
          this.matchesFilter(item, subFilter)
        );
      }
      
      if (key === '$and' && Array.isArray(value)) {
        return value.every((subFilter: Record<string, any>) => 
          this.matchesFilter(item, subFilter)
        );
      }
      
      // 普通属性比较
      return item[key] === value;
    });
  }

  // 实现 IBaseDatabaseClient 接口
  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeMockData();
    this.initialized = true;
      this.emit('initialized');
      this.logger.info(`Mock 数据库客户端初始化成功 (${this.mockConfig.mockMode} 模式)`);
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        '初始化 Mock 数据库客户端失败',
        error
      );
    }
  }

  /**
   * 关闭数据库连接
   * 如果是JSON模式且启用了自动保存，将保存数据到JSON文件
   */
  async close(): Promise<void> {
    try {
      // 如果是JSON模式且启用了自动保存，保存数据
      if (this.initialized && this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
        await this.saveDataToJson();
      }
      
      this.initialized = false;
      this.emit('closed');
      this.logger.info('Mock 数据库客户端已关闭');
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.CONNECTION_ERROR,
        '关闭 Mock 数据库客户端失败',
        error
      );
    }
  }

  /**
   * 清空数据库
   * 根据模式不同，行为略有不同：
   * - memory模式: 清空内存数据并重新初始化内存中的测试数据
   * - json模式: 清空内存数据并更新JSON文件(如果autoSave为true)
   */
  async clear(): Promise<void> {
    try {
      this.checkInitialized();
      
      // 清空所有表数据
      Object.values(this.data).forEach(table => table.clear());
      
      // 根据模式不同处理
      if (this.mockConfig.mockMode === 'memory') {
        // 内存模式：重新初始化测试数据
        this.initializeMemoryData();
        this.logger.info('Mock 数据库已清空并重新初始化内存数据');
      } else {
        // JSON模式：如果启用了自动保存，保存空数据到JSON
        if (this.mockConfig.autoSave) {
          await this.saveDataToJson();
        }
        this.logger.info('Mock 数据库已清空' + (this.mockConfig.autoSave ? '并已更新JSON文件' : ''));
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '清空 Mock 数据库失败',
        error
      );
    }
  }

  /**
   * 强制保存当前数据到JSON文件
   * 仅在mockMode为'json'时可用
   * @throws {DatabaseError} 如果模式不是'json'
   */
  async saveToJson(): Promise<void> {
    try {
      this.checkInitialized();
      
      if (this.mockConfig.mockMode !== 'json') {
        throw this.createError(
          DatabaseErrorCode.OPERATION_FAILED,
          '只能在JSON模式下调用saveToJson方法'
        );
      }
      
      await this.saveDataToJson();
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '保存数据到JSON文件失败',
        error
      );
    }
  }

  /**
   * 强制从JSON文件重新加载数据
   * 仅在mockMode为'json'时可用
   * @throws {DatabaseError} 如果模式不是'json'
   */
  async reloadFromJson(): Promise<void> {
    try {
      this.checkInitialized();
      
      if (this.mockConfig.mockMode !== 'json') {
        throw this.createError(
          DatabaseErrorCode.OPERATION_FAILED,
          '只能在JSON模式下调用reloadFromJson方法'
        );
      }
      
      await this.loadDataFromJson();
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '从JSON文件重新加载数据失败',
        error
      );
    }
  }

  // 通用数据访问方法
  /**
   * 通过 ID 查找记录
   * @param tableName 表名
   * @param id 记录 ID
   * @returns 找到的记录或 null
   */
  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
    return (table.get(id) as T) || null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `查询记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 查找所有符合条件的记录
   * @param tableName 表名
   * @param filter 过滤条件
   * @returns 记录数组
   */
  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
      const formattedFilter = this.formatFilter(filter);
    
      if (!formattedFilter || Object.keys(formattedFilter).length === 0) {
      return Array.from(table.values()) as T[];
    }
    
    return Array.from(table.values())
        .filter(item => this.matchesFilter(item, formattedFilter)) as T[];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `查询记录失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 创建记录
   * @param tableName 表名
   * @param data 记录数据
   * @returns 创建的记录
   */
  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳
      const itemWithTimestamps = this.addTimestamps(data);
    
    // 存储数据
    table.set(data.id, itemWithTimestamps);
      
      // 如果是JSON模式且启用了自动保存，保存数据
      if (this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
        await this.saveDataToJson();
      }
      
      this.logger.info(`记录已创建: ${tableName}/${data.id}`);
    
    return itemWithTimestamps as T;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `创建记录失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 更新记录
   * @param tableName 表名
   * @param id 记录 ID
   * @param data 更新的数据
   */
  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
    
    // 检查记录是否存在
    const existingItem = table.get(id);
    if (!existingItem) {
        throw this.createError(
          DatabaseErrorCode.NOT_FOUND,
          `记录不存在: ${tableName}/${id}`
        );
    }
    
    // 更新数据
    const updatedItem = {
      ...existingItem,
      ...data,
      id, // 确保 ID 不变
      updatedAt: new Date()
    };
    
    table.set(id, updatedItem);
      
      // 如果是JSON模式且启用了自动保存，保存数据
      if (this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
        await this.saveDataToJson();
      }
      
      this.logger.info(`记录已更新: ${tableName}/${id}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `更新记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 删除记录
   * @param tableName 表名
   * @param id 记录 ID
   */
  async delete(tableName: string, id: string): Promise<void> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
      
      // 检查记录是否存在
      if (!table.has(id)) {
        throw this.createError(
          DatabaseErrorCode.NOT_FOUND,
          `记录不存在: ${tableName}/${id}`
        );
      }
      
    table.delete(id);
      
      // 如果是JSON模式且启用了自动保存，保存数据
      if (this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
        await this.saveDataToJson();
      }
      
      this.logger.info(`记录已删除: ${tableName}/${id}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `删除记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 执行查询
   * @param tableName 表名
   * @param options 查询选项
   * @returns 查询结果
   */
  async query<T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    try {
    this.checkInitialized();
      
    const table = this.getTable(tableName);
    let results = Array.from(table.values());
    
    // 应用过滤条件
    if (options.where) {
        results = results.filter(item => {
          if (typeof options.where === 'object' && !Array.isArray(options.where)) {
            return this.matchesFilter(item, options.where as Record<string, any>);
          }
          return true;
        });
      }
      
      // 总数
      const total = results.length;
    
    // 应用排序
    if (options.orderBy) {
        const { field, direction } = options.orderBy;
      results.sort((a, b) => {
          const aValue = a[field];
          const bValue = b[field];
          
          if (aValue < bValue) return direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // 应用分页
      let hasMore = false;
      if (options.limit !== undefined) {
      const offset = options.offset || 0;
        hasMore = total > offset + options.limit;
        results = results.slice(offset, offset + options.limit);
      }
      
      return {
        data: results as T[],
        total,
        hasMore
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 统计记录数量
   * @param tableName 表名
   * @param filter 过滤条件
   * @returns 记录数量
   */
  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    try {
    this.checkInitialized();
      
      const results = await this.findAll(tableName, filter);
      return results.length;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `统计记录数量失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 执行原始查询
   * @param query 查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    try {
    this.checkInitialized();
      
      this.logger.info('Mock executeRawQuery:', { query, params });
      return [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        '执行原始查询失败',
        error
      );
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<void> {
    try {
      this.checkInitialized();
      
      if (this.transactionActive) {
        throw this.createError(
          DatabaseErrorCode.TRANSACTION_ERROR,
          '已有活动的事务'
        );
      }
      
      this.transactionActive = true;
      this.logger.info('事务已开始');
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        '开始事务失败',
        error
      );
    }
  }

  /**
   * 提交事务
   */
  async commitTransaction(): Promise<void> {
    try {
      this.checkInitialized();
      this.checkTransactionActive();
      
      this.transactionActive = false;
      
      // 如果是JSON模式且启用了自动保存，保存数据
      if (this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
        await this.saveDataToJson();
      }
      
      this.logger.info('事务已提交');
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_COMMIT_ERROR,
        '提交事务失败',
        error
      );
    }
  }

  /**
   * 回滚事务
   */
  async rollbackTransaction(): Promise<void> {
    try {
      this.checkInitialized();
      this.checkTransactionActive();
      
      // 如果是JSON模式，考虑重新加载数据以实现回滚
      if (this.mockConfig.mockMode === 'json') {
        await this.loadDataFromJson();
      }
      
      this.transactionActive = false;
      this.logger.info('事务已回滚');
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ROLLBACK_ERROR,
        '回滚事务失败',
        error
      );
    }
  }

  /**
   * 在事务中执行操作
   * @param callback 事务回调函数
   * @returns 回调函数的返回值
   */
  async transaction<T>(callback: (trx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    try {
      this.checkInitialized();
      
      await this.beginTransaction();
      
      try {
        const result = await callback(this);
        await this.commitTransaction();
        return result;
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        '事务执行失败',
        error
      );
    }
  }

  /**
   * 批量操作
   * @param tableName 表名
   * @param operations 操作列表
   */
  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    try {
      this.checkInitialized();
      
      await this.beginTransaction();
      
      try {
        for (const operation of operations) {
          switch (operation.type) {
            case 'add':
              await this.create(tableName, operation.data);
              break;
            case 'put':
              await this.update(tableName, operation.data.id, operation.data);
              break;
            case 'delete':
              await this.delete(tableName, operation.data.id);
              break;
            default:
              throw this.createError(
                DatabaseErrorCode.INVALID_DATA,
                `不支持的批量操作类型: ${(operation as any).type}`
              );
          }
        }
        
        await this.commitTransaction();
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '批量操作失败',
        error
      );
    }
  }

  // 实现 IDatabaseClient 接口的特定于表的方法
  /**
   * 查找用户
   * @param query 查询条件
   * @returns 用户列表
   */
  async findUsers(query?: any): Promise<User[]> {
    return this.findAll<User>('users', query);
  }

  /**
   * 查找匹配
   * @param query 查询条件
   * @returns 匹配列表
   */
  async findMatches(query?: any): Promise<Match[]> {
    return this.findAll<Match>('matches', query);
  }

  /**
   * 查找消息
   * @param query 查询条件
   * @returns 消息列表
   */
  async findMessages(query?: any): Promise<Message[]> {
    return this.findAll<Message>('messages', query);
  }

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户
   */
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.create<User>('users', data as User);
  }

  /**
   * 创建匹配
   * @param data 匹配数据
   * @returns 创建的匹配
   */
  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }

  /**
   * 创建消息
   * @param data 消息数据
   * @returns 创建的消息
   */
  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return this.create<Message>('messages', data as Message);
  }

  /**
   * 更新用户
   * @param id 用户ID
   * @param data 更新的数据
   */
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update<User>('users', id, data);
  }

  /**
   * 更新匹配
   * @param id 匹配ID
   * @param data 更新的数据
   */
  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update<Match>('matches', id, data);
  }

  /**
   * 更新消息
   * @param id 消息ID
   * @param data 更新的数据
   */
  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update<Message>('messages', id, data);
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  async deleteUser(id: string): Promise<void> {
    return this.delete('users', id);
  }

  /**
   * 删除匹配
   * @param id 匹配ID
   */
  async deleteMatch(id: string): Promise<void> {
    return this.delete('matches', id);
  }

  /**
   * 删除消息
   * @param id 消息ID
   */
  async deleteMessage(id: string): Promise<void> {
    return this.delete('messages', id);
  }
}