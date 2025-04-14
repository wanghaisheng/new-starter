import { IDataService } from './data-service';
import { DatabaseFactory } from '@/core/lib/db/factory';
import { DatabaseConfig } from '@/core/lib/db/config';
import { User, Match, Message } from '@/core/lib/db/types';
import { DatabaseError } from '@/core/lib/db/errors/database-error';
import { logger } from '@/core/lib/logger';

export class SqliteDataService implements IDataService {
  private static instance: SqliteDataService | null = null;
  private client: any;
  private isInitialized: boolean = false;

  private constructor(config: DatabaseConfig) {
    this.client = null;
  }

  public static getInstance(config: DatabaseConfig): SqliteDataService {
    if (!SqliteDataService.instance) {
      SqliteDataService.instance = new SqliteDataService(config);
    }
    return SqliteDataService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.client = await DatabaseFactory.createClient({
        ...this.config,
        engine: 'sqlite'
      });
      await this.client.initialize();
      this.isInitialized = true;
      logger.info('SQLite data service initialized');
    } catch (error) {
      logger.error('Failed to initialize SQLite data service', { error });
      throw new DatabaseError(
        'Failed to initialize SQLite data service',
        'INITIALIZATION_ERROR',
        error
      );
    }
  }

  async clearAll(): Promise<void> {
    this.checkInitialized();
    try {
      await this.client.clear();
      logger.info('SQLite database cleared');
    } catch (error) {
      logger.error('Failed to clear SQLite database', { error });
      throw new DatabaseError(
        'Failed to clear SQLite database',
        'OPERATION_FAILED',
        error
      );
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    this.checkInitialized();
    try {
      const result = await this.client.query<User>('users', {});
      return result.data;
    } catch (error) {
      logger.error('Failed to get users', { error });
      throw new DatabaseError(
        'Failed to get users',
        'QUERY_ERROR',
        error
      );
    }
  }

  async getUserById(id: string): Promise<User | null> {
    this.checkInitialized();
    try {
      const result = await this.client.query<User>('users', { where: { id } });
      return result.data[0] || null;
    } catch (error) {
      logger.error('Failed to get user by id', { id, error });
      throw new DatabaseError(
        'Failed to get user by id',
        'QUERY_ERROR',
        error
      );
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    this.checkInitialized();
    try {
      return await this.client.create<User>('users', user);
    } catch (error) {
      logger.error('Failed to create user', { user, error });
      throw new DatabaseError(
        'Failed to create user',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    this.checkInitialized();
    try {
      return await this.client.update<User>('users', id, user);
    } catch (error) {
      logger.error('Failed to update user', { id, user, error });
      throw new DatabaseError(
        'Failed to update user',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    this.checkInitialized();
    try {
      await this.client.delete('users', id);
    } catch (error) {
      logger.error('Failed to delete user', { id, error });
      throw new DatabaseError(
        'Failed to delete user',
        'OPERATION_FAILED',
        error
      );
    }
  }

  // Match methods
  async getMatches(): Promise<Match[]> {
    this.checkInitialized();
    try {
      const result = await this.client.query<Match>('matches', {});
      return result.data;
    } catch (error) {
      logger.error('Failed to get matches', { error });
      throw new DatabaseError(
        'Failed to get matches',
        'QUERY_ERROR',
        error
      );
    }
  }

  async getMatchById(id: string): Promise<Match | null> {
    this.checkInitialized();
    try {
      const result = await this.client.query<Match>('matches', { where: { id } });
      return result.data[0] || null;
    } catch (error) {
      logger.error('Failed to get match by id', { id, error });
      throw new DatabaseError(
        'Failed to get match by id',
        'QUERY_ERROR',
        error
      );
    }
  }

  async createMatch(match: Partial<Match>): Promise<Match> {
    this.checkInitialized();
    try {
      return await this.client.create<Match>('matches', match);
    } catch (error) {
      logger.error('Failed to create match', { match, error });
      throw new DatabaseError(
        'Failed to create match',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async updateMatch(id: string, match: Partial<Match>): Promise<Match> {
    this.checkInitialized();
    try {
      return await this.client.update<Match>('matches', id, match);
    } catch (error) {
      logger.error('Failed to update match', { id, match, error });
      throw new DatabaseError(
        'Failed to update match',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async deleteMatch(id: string): Promise<void> {
    this.checkInitialized();
    try {
      await this.client.delete('matches', id);
    } catch (error) {
      logger.error('Failed to delete match', { id, error });
      throw new DatabaseError(
        'Failed to delete match',
        'OPERATION_FAILED',
        error
      );
    }
  }

  // Message methods
  async getMessages(matchId?: string): Promise<Message[]> {
    this.checkInitialized();
    try {
      const query = matchId ? { where: { matchId } } : {};
      const result = await this.client.query<Message>('messages', query);
      return result.data;
    } catch (error) {
      logger.error('Failed to get messages', { matchId, error });
      throw new DatabaseError(
        'Failed to get messages',
        'QUERY_ERROR',
        error
      );
    }
  }

  async getMessageById(id: string): Promise<Message | null> {
    this.checkInitialized();
    try {
      const result = await this.client.query<Message>('messages', { where: { id } });
      return result.data[0] || null;
    } catch (error) {
      logger.error('Failed to get message by id', { id, error });
      throw new DatabaseError(
        'Failed to get message by id',
        'QUERY_ERROR',
        error
      );
    }
  }

  async createMessage(message: Partial<Message>): Promise<Message> {
    this.checkInitialized();
    try {
      return await this.client.create<Message>('messages', message);
    } catch (error) {
      logger.error('Failed to create message', { message, error });
      throw new DatabaseError(
        'Failed to create message',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async updateMessage(id: string, message: Partial<Message>): Promise<Message> {
    this.checkInitialized();
    try {
      return await this.client.update<Message>('messages', id, message);
    } catch (error) {
      logger.error('Failed to update message', { id, message, error });
      throw new DatabaseError(
        'Failed to update message',
        'OPERATION_FAILED',
        error
      );
    }
  }

  async deleteMessage(id: string): Promise<void> {
    this.checkInitialized();
    try {
      await this.client.delete('messages', id);
    } catch (error) {
      logger.error('Failed to delete message', { id, error });
      throw new DatabaseError(
        'Failed to delete message',
        'OPERATION_FAILED',
        error
      );
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new DatabaseError(
        'SQLite data service not initialized',
        'CLIENT_NOT_INITIALIZED'
      );
    }
  }
} 