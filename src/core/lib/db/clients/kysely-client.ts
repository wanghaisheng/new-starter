import { Kysely, PostgresDialect, ReferenceExpression, CompiledQuery, Compilable, sql } from 'kysely';
import { Database } from '@/core/lib/db/schema';
import { IDatabaseClient, QueryResult, BatchOperation } from '@/core/lib/db/interfaces';
import { User, Match, Message, Photo, BaseEntity } from '@/core/lib/db/types';
import { Pool } from 'pg';
import { Capacitor } from '@capacitor/core';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb';
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import { Database as BetterSQLiteDatabase } from 'better-sqlite3';
import { SqliteDialect } from 'kysely';
import { Logger } from '@/core/lib/utils/logger';

export class KyselyClient implements IDatabaseClient {
  private db: Kysely<Database>;
  private _isInitialized: boolean = false;
  private client: IDatabaseClient;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    // 在浏览器环境中使用 IndexedDB
    if (typeof window !== 'undefined') {
      this.client = new IndexedDBClient({
        name: config.database,
        version: 1,
        engine: 'indexeddb',
        tables: {}
      });
    } 
    // 在移动端使用 SQLite
    else if (Capacitor.isNativePlatform()) {
      this.client = new SQLiteClient({
        name: config.database,
        version: 1,
        engine: 'sqlite',
        tables: {}
      });
    }
    // 在服务器端使用 PostgreSQL
    else {
      const dialect = new PostgresDialect({
        pool: new Pool({
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database,
        }),
      });

      this.db = new Kysely<Database>({
        dialect,
      });
    }
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // 检查数据库连接
      await this.db.selectFrom('users').select('id').limit(1).execute();
      this._isInitialized = true;
      console.log('KyselyClient initialized successfully');
    } catch (error) {
      console.error('Error initializing KyselyClient:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    await this.db.deleteFrom('messages').execute();
    await this.db.deleteFrom('matches').execute();
    await this.db.deleteFrom('users').execute();
  }

  // Generic operations
  async findById<T>(collection: string, id: string): Promise<T | null> {
    this.checkInitialized();
    const result = await this.db
      .selectFrom(collection as keyof Database)
      .selectAll()
      .where('id' as ReferenceExpression<Database, keyof Database>, '=', id)
      .executeTakeFirst();
    return result as T | null;
  }

  async findAll<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    let query = this.db
      .selectFrom(collection as keyof Database)
      .selectAll();

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.where(key as ReferenceExpression<Database, keyof Database>, '=', value);
      });
    }

    const results = await query.execute();
    return results as T[];
  }

  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    this.checkInitialized();
    const result = await this.db
      .insertInto(collection as keyof Database)
      .values(data as any)
      .returningAll()
      .executeTakeFirst();
    return result as T;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    this.checkInitialized();
    const result = await this.db
      .updateTable(collection as keyof Database)
      .set(data as any)
      .where('id' as ReferenceExpression<Database, keyof Database>, '=', id)
      .returningAll()
      .executeTakeFirst();
    return result as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    this.checkInitialized();
    const result = await this.db
      .deleteFrom(collection as keyof Database)
      .where('id' as ReferenceExpression<Database, keyof Database>, '=', id)
      .execute();
    return result.length > 0;
  }

  // User specific operations
  async findUsers(query?: Partial<User>): Promise<User[]> {
    this.checkInitialized();
    let qb = this.db.selectFrom('users').selectAll();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        qb = qb.where(key as ReferenceExpression<Database, 'users'>, '=', value);
      });
    }
    
    const results = await qb.execute();
    return results.map(result => ({
      ...result,
      photos: result.photos.map((url, index) => ({
        id: `${result.id}-photo-${index}`,
        url,
        isPrimary: index === 0,
        order: index,
        isMain: index === 0,
        userId: result.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Photo))
    })) as User[];
  }

  async createUser(user: User): Promise<User> {
    this.checkInitialized();
    const userData = {
      ...user,
      photos: user.photos.map(photo => photo.url)
    };
    const result = await this.create('users', userData);
    return {
      ...result,
      photos: result.photos.map((url, index) => ({
        id: `${result.id}-photo-${index}`,
        url,
        isPrimary: index === 0,
        order: index,
        isMain: index === 0,
        userId: result.id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Photo))
    } as User;
  }

  async deleteUser(userId: string): Promise<boolean> {
    this.checkInitialized();
    return this.delete('users', userId);
  }

  // Match specific operations
  async findMatches(query?: Partial<Match>): Promise<Match[]> {
    this.checkInitialized();
    let qb = this.db.selectFrom('matches').selectAll();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        qb = qb.where(key as ReferenceExpression<Database, 'matches'>, '=', value);
      });
    }
    
    return qb.execute() as Promise<Match[]>;
  }

  async createMatch(match: Match): Promise<Match> {
    this.checkInitialized();
    return this.create('matches', match);
  }

  async deleteMatch(matchId: string): Promise<boolean> {
    this.checkInitialized();
    return this.delete('matches', matchId);
  }

  // Message specific operations
  async findMessages(query?: Partial<Message>): Promise<Message[]> {
    this.checkInitialized();
    let qb = this.db.selectFrom('messages').selectAll();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        qb = qb.where(key as ReferenceExpression<Database, 'messages'>, '=', value);
      });
    }
    
    return qb.execute() as Promise<Message[]>;
  }

  async createMessage(message: Message): Promise<Message> {
    this.checkInitialized();
    return this.create('messages', message);
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    this.checkInitialized();
    return this.delete('messages', messageId);
  }

  // Additional methods required by IDatabaseClient
  async query<T>(collection: string, query: any): Promise<QueryResult<T>> {
    this.checkInitialized();
    const data = await this.findAll<T>(collection, query);
    const total = data.length;
    return { data, total, hasMore: false };
  }

  async count(collection: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    let qb = this.db
      .selectFrom(collection as keyof Database)
      .select(this.db.fn.count('id' as ReferenceExpression<Database, keyof Database>).as('count'));

    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        qb = qb.where(key as ReferenceExpression<Database, keyof Database>, '=', value);
      });
    }

    const result = await qb.executeTakeFirst();
    return Number(result?.count) || 0;
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    const compiledQuery = sql`${query}`.compile(this.db);
    const result = await this.db.executeQuery(compiledQuery);
    return result.rows as R[];
  }

  async connect(): Promise<void> {
    // Kysely 使用连接池，不需要显式连接
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Kysely 使用连接池，不需要显式断开连接
    return Promise.resolve();
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    await this.db.transaction().execute(async () => {});
  }

  async commitTransaction(): Promise<void> {
    // Kysely 事务自动提交
    return Promise.resolve();
  }

  async rollbackTransaction(): Promise<void> {
    // Kysely 事务自动回滚
    return Promise.resolve();
  }

  async batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
    this.checkInitialized();
    await this.db.transaction().execute(async (trx) => {
      for (const op of operations) {
        const data = {
          ...op.data,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        switch (op.type) {
          case 'add':
            await trx.insertInto(tableName as keyof Database)
              .values(data as any)
              .execute();
            break;
          case 'put':
            await trx.updateTable(tableName as keyof Database)
              .set(data as any)
              .where('id' as ReferenceExpression<Database, keyof Database>, '=', op.data.id)
              .execute();
            break;
          case 'delete':
            await trx.deleteFrom(tableName as keyof Database)
              .where('id' as ReferenceExpression<Database, keyof Database>, '=', op.data.id)
              .execute();
            break;
        }
      }
    });
  }

  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('KyselyClient not initialized');
    }
  }
} 