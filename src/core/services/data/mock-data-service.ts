import { IDataService } from './data-service-interface';
import { User, Match, Message, BaseEntity } from '@/core/lib/db/types';
import { NetworkService } from './network-service';
import { MockDatabaseClient, MockDatabaseConfig } from '@/core/lib/db/clients/mock/mock-client';
import { DatabaseConfig } from '@/core/lib/db/interfaces';

interface MockDataServiceConfig {
  mockMode?: 'memory' | 'json';
  jsonFilePath?: string;
  autoSave?: boolean;
}

/**
 * Mock数据服务
 * 用于开发和测试环境，提供内存中的数据存储
 */
export class MockDataService implements IDataService {
  private static instance: MockDataService | null = null;
  private client: MockDatabaseClient;
  private _isInitialized: boolean = false;
  private networkService: NetworkService;

  private constructor(serviceConfig: MockDataServiceConfig) {
    const dbConfig: MockDatabaseConfig = {
      name: 'mock-database',
      version: 1,
      engine: 'mock',
      tables: {
        users: {
          columns: {
            id: { type: 'string', constraints: ['primary'] },
            name: { type: 'string' }
          }
        }
      },
      mockMode: serviceConfig.mockMode || 'memory',
      jsonFilePath: serviceConfig.jsonFilePath,
      autoSave: serviceConfig.autoSave
    };
    
    this.client = new MockDatabaseClient(dbConfig);
    this.networkService = NetworkService.getInstance();
  }

  public static getInstance(config?: MockDataServiceConfig): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService(config || {
        mockMode: 'memory'
      });
    }
    return MockDataService.instance;
  }

  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      await this.client.initialize();
      this._isInitialized = true;
      console.log('MockDataService initialized successfully');
    } catch (error) {
      console.error('Error initializing MockDataService:', error);
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public async clearAll(): Promise<void> {
    await this.client.clear();
    console.log('MockDataService data cleared');
  }

  // User operations
  public async getUser(userId: string): Promise<User> {
    this.checkInitialized();
    const user = await this.client.findById<User>('users', userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }

  public async getUserById(userId: string): Promise<User | null> {
    this.checkInitialized();
    return this.client.findById<User>('users', userId);
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    this.checkInitialized();
    const users = await this.client.findUsers({ email });
    return users[0] || null;
  }

  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    this.checkInitialized();
    const users = await this.client.findUsers({ phone: phoneNumber });
    return users[0] || null;
  }

  public async getUsers(): Promise<User[]> {
    this.checkInitialized();
    return this.client.findUsers();
  }

  public async getUsersByIds(userIds: string[]): Promise<User[]> {
    this.checkInitialized();
    const users = await this.client.findUsers();
    return users.filter(user => userIds.includes(user.id));
  }

  public async createUser(user: User): Promise<User> {
    this.checkInitialized();
    return this.client.createUser(user);
  }

  public async bulkCreateUsers(users: User[]): Promise<User[]> {
    this.checkInitialized();
    return Promise.all(users.map(user => this.client.createUser(user)));
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    this.checkInitialized();
    const user = await this.getUser(userId);
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    await this.client.deleteUser(userId);
    return this.client.createUser(updatedUser);
  }

  public async deleteUser(userId: string): Promise<void> {
    this.checkInitialized();
    await this.client.deleteUser(userId);
  }

  // Match operations
  public async getMatch(matchId: string): Promise<Match> {
    this.checkInitialized();
    const match = await this.client.findById<Match>('matches', matchId);
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    return match;
  }

  public async getMatches(userId?: string): Promise<Match[]> {
    this.checkInitialized();
    const matches = await this.client.findAll<Match>('matches');
    return userId
      ? matches.filter(match => match.users.includes(userId))
      : matches;
  }

  public async createMatch(match: Match): Promise<Match> {
    this.checkInitialized();
    return this.client.create<Match>('matches', match);
  }

  public async bulkCreateMatches(matches: Match[]): Promise<Match[]> {
    this.checkInitialized();
    return Promise.all(matches.map(match => this.client.create<Match>('matches', match)));
  }

  public async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
    this.checkInitialized();
    const match = await this.getMatch(matchId);
    const updatedMatch = { ...match, ...updates, updatedAt: new Date() };
    await this.client.deleteMatch(matchId);
    return this.client.create<Match>('matches', updatedMatch);
  }

  public async deleteMatch(matchId: string): Promise<void> {
    this.checkInitialized();
    await this.client.deleteMatch(matchId);
  }

  // Message operations
  public async getMessage(messageId: string): Promise<Message> {
    this.checkInitialized();
    const message = await this.client.findById<Message>('messages', messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    return message;
  }

  public async getMessages(matchId?: string): Promise<Message[]> {
    this.checkInitialized();
    const messages = await this.client.findMessages();
    return matchId
      ? messages.filter(message => message.matchId === matchId)
      : messages;
  }

  public async getUnreadMessages(userId: string): Promise<Message[]> {
    this.checkInitialized();
    const messages = await this.client.findMessages();
    return messages.filter(message => 
      message.receiverId === userId && message.status !== 'read'
    );
  }

  public async createMessage(message: Message): Promise<Message> {
    this.checkInitialized();
    return this.client.createMessage(message);
  }

  public async bulkCreateMessages(messages: Message[]): Promise<Message[]> {
    this.checkInitialized();
    return Promise.all(messages.map(message => this.client.createMessage(message)));
  }

  public async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    this.checkInitialized();
    const message = await this.getMessage(messageId);
    const updatedMessage = { ...message, ...updates, updatedAt: new Date() };
    await this.client.deleteMessage(messageId);
    return this.client.createMessage(updatedMessage);
  }

  public async deleteMessage(messageId: string): Promise<void> {
    this.checkInitialized();
    await this.client.deleteMessage(messageId);
  }

  // Generic data operations
  public async get<T extends BaseEntity>(tableName: string, id: string): Promise<T> {
    this.checkInitialized();
    const item = await this.client.findById<T>(tableName, id);
    if (!item) {
      throw new Error(`Item with ID ${id} not found in table ${tableName}`);
    }
    return item;
  }

  public async getAll<T extends BaseEntity>(tableName: string): Promise<T[]> {
    this.checkInitialized();
    return this.client.findAll<T>(tableName);
  }

  public async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    return this.client.create<T>(tableName, data);
  }

  public async update<T extends BaseEntity>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
    this.checkInitialized();
    const item = await this.get<T>(tableName, id);
    const updatedItem = { ...item, ...updates, updatedAt: new Date() };
    await this.client.delete(tableName, id);
    return this.client.create<T>(tableName, updatedItem);
  }

  public async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    await this.client.delete(tableName, id);
  }

  public async sync(): Promise<void> {
    this.checkInitialized();
    // Mock implementation - no actual sync needed
    console.log('Mock sync completed');
  }

  public async isOfflineOnlyTable(tableName: string): Promise<boolean> {
    this.checkInitialized();
    // In mock service, all tables are considered online tables
    return false;
  }

  // Private helper methods
  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('MockDataService not initialized');
    }
  }
} 