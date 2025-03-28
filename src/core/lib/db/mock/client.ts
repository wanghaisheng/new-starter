import { DatabaseClient, DatabaseConfig, PlatformDatabaseConfig } from '../interfaces';
import { User, Match, Message } from '../interfaces';

export class MockDatabaseClient implements DatabaseClient {
  private connected: boolean = false;
  private data: {
    users: Map<string, User>;
    matches: Map<string, Match>;
    messages: Map<string, Message>;
  } = {
    users: new Map(),
    matches: new Map(),
    messages: new Map(),
  };

  constructor(private config: PlatformDatabaseConfig) {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 添加一些测试用户
    const testUsers: User[] = [
      {
        id: '1',
        username: 'test_user1',
        email: 'test1@example.com',
        profileImage: 'https://example.com/avatar1.jpg',
        bio: 'Test user 1',
        preferences: {
          ageRange: { min: 18, max: 30 },
          distance: 50,
          gender: ['female'],
          interests: ['music', 'travel'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        username: 'test_user2',
        email: 'test2@example.com',
        profileImage: 'https://example.com/avatar2.jpg',
        bio: 'Test user 2',
        preferences: {
          ageRange: { min: 20, max: 35 },
          distance: 30,
          gender: ['male'],
          interests: ['sports', 'movies'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    testUsers.forEach(user => this.data.users.set(user.id, user));
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // 简单的 SQL 解析和模拟实现
    if (sql.toLowerCase().includes('select')) {
      if (sql.toLowerCase().includes('users')) {
        return Array.from(this.data.users.values()) as T[];
      } else if (sql.toLowerCase().includes('matches')) {
        return Array.from(this.data.matches.values()) as T[];
      } else if (sql.toLowerCase().includes('messages')) {
        return Array.from(this.data.messages.values()) as T[];
      }
    }

    return [];
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // 简单的 SQL 解析和模拟实现
    if (sql.toLowerCase().includes('insert')) {
      // 模拟插入操作
      console.log('Mock insert:', sql, params);
    } else if (sql.toLowerCase().includes('update')) {
      // 模拟更新操作
      console.log('Mock update:', sql, params);
    } else if (sql.toLowerCase().includes('delete')) {
      // 模拟删除操作
      console.log('Mock delete:', sql, params);
    }
  }

  async beginTransaction(): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log('Mock begin transaction');
  }

  async commit(): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log('Mock commit transaction');
  }

  async rollback(): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log('Mock rollback transaction');
  }

  async sync(): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log('Mock sync data');
  }

  async getLastSyncTimestamp(): Promise<number> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    return Date.now();
  }
} 