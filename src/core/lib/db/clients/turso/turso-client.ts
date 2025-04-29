import type { IDatabaseClient } from '@/core/lib/db/interfaces';
import type { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { createDatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database';
import { DatabaseErrorCode } from '@/core/lib/db/types/common';
import { Logger } from '@/core/lib/utils/logger';

/**
 * Turso客户端配置
 */
export interface TursoConfig {
  url: string;
  authToken: string;
}

/**
 * Turso数据库客户端
 */
export class TursoClient implements IDatabaseClient {
  private client: any;
  private config: TursoConfig;
  private logger: Logger;
  private initialized: boolean = false;
  private transaction: any = null;

  constructor(config: TursoConfig) {
    this.config = config;
    this.logger = new Logger('TursoClient');
  }

  public async connect(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  public async disconnect(): Promise<void> {
    this.initialized = false;
  }

  public async initialize(): Promise<void> {
    try {
      const { createClient } = await import('@libsql/client');
      this.client = createClient({
        url: this.config.url,
        authToken: this.config.authToken
      });
      this.initialized = true;
      this.logger.info('Turso client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Turso client:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to initialize Turso client', error);
    }
  }

  public async close(): Promise<void> {
    this.initialized = false;
  }

  public async clear(): Promise<void> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }
    // Turso does not support clearing the entire database
    this.logger.warn('Clearing Turso database is not supported');
  }

  public async findById<T>(collection: string, id: string): Promise<T | null> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const result = await this.client.execute({
        sql: `SELECT * FROM ${collection} WHERE id = ?`,
        args: [id]
      });
      return result.rows[0] as T || null;
    } catch (error) {
      this.logger.error(`Failed to find record by id ${id} in collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, `Failed to find record by id ${id}`, error);
    }
  }

  public async findAll<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      let sql = `SELECT * FROM ${collection}`;
      const args: any[] = [];
      
      if (filter) {
        const conditions = Object.entries(filter).map(([key, value], index) => {
          args.push(value);
          return `${key} = ?`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.client.execute({ sql, args });
      return result.rows as T[];
    } catch (error) {
      this.logger.error(`Failed to find records in collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to find records', error);
    }
  }

  public async create<T>(collection: string, data: Partial<T>): Promise<T> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const sql = `INSERT INTO ${collection} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.client.execute({ sql, args: values });
      return result.rows[0] as T;
    } catch (error) {
      this.logger.error(`Failed to create record in collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to create record', error);
    }
  }

  public async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const updates = Object.entries(data).map(([key, value]) => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];

      const sql = `UPDATE ${collection} SET ${updates} WHERE id = ? RETURNING *`;
      const result = await this.client.execute({ sql, args: values });
      return result.rows[0] as T;
    } catch (error) {
      this.logger.error(`Failed to update record ${id} in collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to update record', error);
    }
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const sql = `DELETE FROM ${collection} WHERE id = ?`;
      await this.client.execute({ sql, args: [id] });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete record ${id} from collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to delete record', error);
    }
  }

  public async query<T>(collection: string, options: QueryOptions): Promise<QueryResult<T>> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      let sql = `SELECT * FROM ${collection}`;
      const args: any[] = [];

      // Apply filters
      if (options.where) {
        const conditions = Object.entries(options.where).map(([key, value], index) => {
          args.push(value);
          return `${key} = ?`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Apply sorting
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy.field} ${options.orderBy.direction}`;
      }

      // Apply pagination
      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
        if (options.offset) {
          sql += ` OFFSET ${options.offset}`;
        }
      }

      const result = await this.client.execute({ sql, args });
      const count = await this.count(collection, options.where);

      return {
        data: result.rows as T[],
        total: count,
        hasMore: options.limit ? result.rows.length >= options.limit : false
      };
    } catch (error) {
      this.logger.error(`Failed to execute query on collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to execute query', error);
    }
  }

  public async count(collection: string, filter?: Record<string, any>): Promise<number> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      let sql = `SELECT COUNT(*) as count FROM ${collection}`;
      const args: any[] = [];
      
      if (filter) {
        const conditions = Object.entries(filter).map(([key, value], index) => {
          args.push(value);
          return `${key} = ?`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.client.execute({ sql, args });
      return result.rows[0].count;
    } catch (error) {
      this.logger.error(`Failed to count records in collection ${collection}:`, error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to count records', error);
    }
  }

  public async beginTransaction(): Promise<void> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      await this.client.execute('BEGIN TRANSACTION');
      this.transaction = true;
    } catch (error) {
      this.logger.error('Failed to begin transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to begin transaction', error);
    }
  }

  public async commitTransaction(): Promise<void> {
    if (!this.transaction) {
      throw createDatabaseError(DatabaseErrorCode.NO_ACTIVE_TRANSACTION, 'No active transaction');
    }

    try {
      await this.client.execute('COMMIT');
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to commit transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to commit transaction', error);
    }
  }

  public async rollbackTransaction(): Promise<void> {
    if (!this.transaction) {
      throw createDatabaseError(DatabaseErrorCode.NO_ACTIVE_TRANSACTION, 'No active transaction');
    }

    try {
      await this.client.execute('ROLLBACK');
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to rollback transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to rollback transaction', error);
    }
  }

  public async batch<T>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      await this.beginTransaction();
      
      for (const operation of operations) {
        switch (operation.type) {
          case 'add':
          case 'put':
            await this.create(tableName, operation.data);
            break;
          case 'delete':
            await this.delete(tableName, (operation.data as any).id);
            break;
        }
      }
      
      await this.commitTransaction();
    } catch (error) {
      await this.rollbackTransaction();
      this.logger.error('Failed to execute batch operations:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to execute batch operations', error);
    }
  }

  public async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const result = await this.client.execute({ sql: query, args: params });
      return result.rows as R[];
    } catch (error) {
      this.logger.error('Failed to execute raw query:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to execute raw query', error);
    }
  }
} 