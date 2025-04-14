import { IDataService } from './data-service';
import { User } from '@/core/lib/db/types/user';
import { Match } from '@/core/lib/db/types/match';
import { Message } from '@/core/lib/db/types/message';
import { MockDatabaseClient, MockDatabaseConfig } from '@/core/lib/db/clients/mock/mock-client';
import { logger } from '@/core/lib/logger';

export interface MockDataServiceConfig {
  mockMode: 'memory' | 'json' | 'indexeddb';
  loadDemoData?: boolean;
  demoDataSource?: 'example' | 'dating';
  autoSave?: boolean;
}

export class MockDataService implements IDataService {
  private static instance: MockDataService | null = null;
  private client: MockDatabaseClient;
  private config: MockDataServiceConfig;

  constructor(config: MockDataServiceConfig) {
    this.config = config;
    const dbConfig: MockDatabaseConfig = {
      name: 'mock-database',
      version: 1,
      engine: 'mock',
      tables: {
        users: {
          columns: {
            id: { type: 'string', constraints: ['primary'] },
            name: { type: 'string' },
            email: { type: 'string' }
          }
        },
        matches: {
          columns: {
            id: { type: 'string', constraints: ['primary'] },
            users: { type: 'array' }
          }
        },
        messages: {
          columns: {
            id: { type: 'string', constraints: ['primary'] },
            matchId: { type: 'string' },
            content: { type: 'string' }
          }
        }
      },
      mockMode: config.mockMode,
      autoSave: config.autoSave ?? true
    };
    this.client = new MockDatabaseClient(dbConfig);
  }

  static getInstance(config: MockDataServiceConfig): MockDataService {
    if (!this.instance) {
      this.instance = new MockDataService(config);
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    await this.client.connect();
    if (this.config.loadDemoData) {
      await this.loadDemoData();
    }
  }

  async clearAll(): Promise<void> {
    await this.client.clear();
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const result = await this.client.query<User>('users', {});
    return result.data;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.client.query<User>('users', { where: { id } });
    return result.data[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.client.query<User>('users', { where: { email } });
    return result.data[0] || null;
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this.client.create<User>('users', user);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.client.update<User>('users', id, user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete('users', id);
  }

  // Match methods
  async getMatches(): Promise<Match[]> {
    const result = await this.client.query<Match>('matches', {});
    return result.data;
  }

  async getMatchById(id: string): Promise<Match | null> {
    const result = await this.client.query<Match>('matches', { where: { id } });
    return result.data[0] || null;
  }

  async createMatch(match: Partial<Match>): Promise<Match> {
    return this.client.create<Match>('matches', match);
  }

  async updateMatch(id: string, match: Partial<Match>): Promise<Match> {
    return this.client.update<Match>('matches', id, match);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.client.delete('matches', id);
  }

  // Message methods
  async getMessages(matchId?: string): Promise<Message[]> {
    const query = matchId ? { where: { matchId } } : {};
    const result = await this.client.query<Message>('messages', query);
    return result.data;
  }

  async getMessageById(id: string): Promise<Message | null> {
    const result = await this.client.query<Message>('messages', { where: { id } });
    return result.data[0] || null;
  }

  async createMessage(message: Partial<Message>): Promise<Message> {
    return this.client.create<Message>('messages', message);
  }

  async updateMessage(id: string, message: Partial<Message>): Promise<Message> {
    return this.client.update<Message>('messages', id, message);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.delete('messages', id);
  }

  private async loadDemoData(): Promise<void> {
    try {
      const source = this.config.demoDataSource || 'example';
      const data = await import(`@/core/lib/db/clients/mock/data/${source}-data.json`);
      
      // Clear existing data
      await this.clearAll();
      
      // Load users
      for (const user of data.users) {
        await this.createUser(user);
      }
      
      // Load matches
      for (const match of data.matches) {
        await this.createMatch(match);
      }
      
      // Load messages
      for (const message of data.messages) {
        await this.createMessage(message);
      }
      
      logger.info('Demo data loaded successfully', { source });
    } catch (error) {
      logger.error('Failed to load demo data', { error });
      throw error;
    }
  }
} 