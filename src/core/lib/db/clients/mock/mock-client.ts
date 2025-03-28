import { BaseClient } from '../base-client';
import { User } from '../../models/user';
import { Match } from '../../models/match';
import { Message } from '../../models/message';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';

/**
 * 模拟数据库客户端
 * 用于测试和开发环境
 */
export class MockDatabaseClient extends BaseClient implements IDatabaseClient {
  private data: {
    users: Map<string, User>;
    matches: Map<string, Match>;
    messages: Map<string, Message>;
  } = {
    users: new Map(),
    matches: new Map(),
    messages: new Map(),
  };

  constructor(private config: DatabaseConfig) {
    super();
    this.initializeMockData();
  }

  private initializeMockData() {
    // 添加一些测试用户
    const testUsers: User[] = [
      {
        id: '1',
        name: 'test_user1',
        age: 25,
        bio: 'Test user 1',
        images: ['https://example.com/avatar1.jpg'],
        interests: ['music', 'travel'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'test_user2',
        age: 28,
        bio: 'Test user 2',
        images: ['https://example.com/avatar2.jpg'],
        interests: ['sports', 'movies'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    testUsers.forEach(user => this.data.users.set(user.id, user));
  }

  // 实现 IBaseDatabaseClient 接口
  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async close(): Promise<void> {
    // 模拟实现，无需实际操作
  }

  async clear(): Promise<void> {
    this.data.users.clear();
    this.data.matches.clear();
    this.data.messages.clear();
    this.initializeMockData(); // 重新初始化测试数据
  }

  // 通用数据访问方法
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    return (table.get(id) as T) || null;
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    
    if (!filter || Object.keys(filter).length === 0) {
      return Array.from(table.values()) as T[];
    }
    
    return Array.from(table.values())
      .filter(item => this.matchesFilter(item, filter)) as T[];
  }

  async create<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳
    const now = new Date();
    const itemWithTimestamps = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now
    };
    
    // 存储数据
    table.set(data.id, itemWithTimestamps);
    
    return itemWithTimestamps as T;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    
    // 检查记录是否存在
    const existingItem = table.get(id);
    if (!existingItem) {
      throw new Error(`记录不存在: ${tableName}/${id}`);
    }
    
    // 更新数据
    const updatedItem = {
      ...existingItem,
      ...data,
      id, // 确保 ID 不变
      updatedAt: new Date()
    };
    
    table.set(id, updatedItem);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    table.delete(id);
  }

  async query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    this.checkInitialized();
    const table = this.getTable(tableName);
    let results = Array.from(table.values());
    
    // 应用过滤条件
    if (options.where) {
      results = results.filter(item => this.matchesFilter(item, options.where));
    }
    
    // 应用排序
    if (options.orderBy) {
      const orderFields = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      results.sort((a, b) => {
        for (const field of orderFields) {
          const desc = field.startsWith('-');
          const fieldName = desc ? field.substring(1) : field;
          
          if (a[fieldName] < b[fieldName]) return desc ? 1 : -1;
          if (a[fieldName] > b[fieldName]) return desc ? -1 : 1;
        }
        return 0;
      });
    }
    
    // 应用分页
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit !== undefined ? options.limit : results.length;
      results = results.slice(offset, offset + limit);
    }
    
    // 应用字段选择
    if (options.select && options.select.length > 0) {
      results = results.map(item => {
        const result: any = {};
        for (const field of options.select!) {
          result[field] = item[field];
        }
        return result;
      });
    }
    
    return results as T[];
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.checkInitialized();
    console.log('Mock executeRawQuery:', query, params);
    return [];
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    // 模拟事务，直接执行回调
    return callback(this);
  }

  // 实现 IDatabaseClient 接口的特定于表的方法
  async saveUser(user: User): Promise<void> {
    if (user.id) {
      await this.update('users', user.id, user);
    } else {
      await this.create('users', user);
    }
  }

  async getUser(id: string): Promise<User | null> {
    return this.findById<User>('users', id);
  }

  async getUsers(): Promise<User[]> {
    return this.findAll<User>('users');
  }

  async updateUser(user: User): Promise<void> {
    await this.update('users', user.id, user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.delete('users', id);
  }

  async saveMatch(match: Match): Promise<void> {
    if (match.id) {
      await this.update('matches', match.id, match);
    } else {
      await this.create('matches', match);
    }
  }

  async getMatch(id: string): Promise<Match | null> {
    return this.findById<Match>('matches', id);
  }

  async getMatches(): Promise<Match[]> {
    return this.findAll<Match>('matches');
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    return this.query<Match>('matches', {
      where: {
        $or: [{ userId1: userId }, { userId2: userId }]
      }
    });
  }

  async deleteMatch(id: string): Promise<void> {
    await this.delete('matches', id);
  }

  async saveMessage(message: Message): Promise<void> {
    if (message.id) {
      await this.update('messages', message.id, message);
    } else {
      await this.create('messages', message);
    }
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.findById<Message>('messages', id);
  }

  async getMessages(matchId: string): Promise<Message[]> {
    return this.findAll<Message>('messages', { matchId });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.delete('messages', id);
  }

  // 辅助方法
  private getTable(tableName: string): Map<string, any> {
    switch (tableName) {
      case 'users':
        return this.data.users;
      case 'matches':
        return this.data.matches;
      case 'messages':
        return this.data.messages;
      default:
        throw new Error(`表不存在: ${tableName}`);
    }
  }

  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(value)) {
        // 处理 $or 操作符
        if (!value.some(subFilter => this.matchesFilter(item, subFilter))) {
          return false;
        }
      } else if (key === '$ne' && typeof value === 'object') {
        // 处理 $ne 操作符
        const neKey = Object.keys(value)[0];
        if (item[neKey] === value[neKey]) {
          return false;
        }
      } else if (key === '$contains' && typeof value === 'string' && Array.isArray(item[key])) {
        // 处理 $contains 操作符（用于数组）
        if (!item[key].includes(value)) {
          return false;
        }
      } else if (item[key] !== value) {
        return false;
      }
    }
    return true;
  }
}