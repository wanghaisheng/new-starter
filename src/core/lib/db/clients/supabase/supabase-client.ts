import type { IDatabaseClient } from '@/core/lib/db/interfaces';
import type { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { createDatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database';
import { Logger } from '@/core/lib/utils/logger';

/**
 * Supabase客户端配置
 */
export interface SupabaseConfig {
  url: string;
  key: string;
  schema?: string;
}

/**
 * Supabase数据库客户端
 */
export class SupabaseClient implements IDatabaseClient {
  private client: any;
  private config: SupabaseConfig;
  private logger: Logger;
  protected initialized: boolean = false;
  private transaction: any = null;

  constructor(config: SupabaseConfig) {
    this.config = config;
    this.logger = new Logger('SupabaseClient');
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
      const { createClient } = await import('@supabase/supabase-js');
      this.client = createClient(this.config.url, this.config.key, {
        schema: this.config.schema
      });
      this.initialized = true;
      this.logger.info('Supabase client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client:', error);
      throw createDatabaseError(DatabaseErrorCode.INITIALIZATION_FAILED, 'Failed to initialize Supabase client', error);
    }
  }

  public async close(): Promise<void> {
    this.initialized = false;
  }

  public async clear(): Promise<void> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }
    // Supabase does not support clearing the entire database
    this.logger.warn('Clearing Supabase database is not supported');
  }

  public async findById<T>(collection: string, id: string): Promise<T | null> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const { data, error } = await this.client
        .from(collection)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as T;
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
      let query = this.client.from(collection).select('*');
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as T[];
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
      const { data: result, error } = await this.client
        .from(collection)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result as T;
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
      const { data: result, error } = await this.client
        .from(collection)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result as T;
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
      const { error } = await this.client
        .from(collection)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

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
      let supabaseQuery = this.client.from(collection).select('*');

      // Apply filters
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          supabaseQuery = supabaseQuery.eq(key, value);
        });
      }

      // Apply sorting
      if (options.orderBy) {
        Object.entries(options.orderBy).forEach(([key, direction]) => {
          supabaseQuery = supabaseQuery.order(key, { ascending: direction === 'asc' });
        });
      }

      // Apply pagination
      if (options.limit) {
        supabaseQuery = supabaseQuery.limit(options.limit);
      }
      if (options.offset) {
        supabaseQuery = supabaseQuery.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw error;
      }

      return {
        data: data as T[],
        total: count || 0,
        hasMore: options.limit ? data.length >= options.limit : false
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
      let query = this.client.from(collection).select('*', { count: 'exact', head: true });
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
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
      this.transaction = await this.client.rpc('begin_transaction');
    } catch (error) {
      this.logger.error('Failed to begin transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.TRANSACTION_FAILED, 'Failed to begin transaction', error);
    }
  }

  public async commitTransaction(): Promise<void> {
    if (!this.transaction) {
      throw createDatabaseError(DatabaseErrorCode.NO_ACTIVE_TRANSACTION, 'No active transaction');
    }

    try {
      await this.client.rpc('commit_transaction');
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to commit transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.TRANSACTION_FAILED, 'Failed to commit transaction', error);
    }
  }

  public async rollbackTransaction(): Promise<void> {
    if (!this.transaction) {
      throw createDatabaseError(DatabaseErrorCode.NO_ACTIVE_TRANSACTION, 'No active transaction');
    }

    try {
      await this.client.rpc('rollback_transaction');
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to rollback transaction:', error);
      throw createDatabaseError(DatabaseErrorCode.TRANSACTION_FAILED, 'Failed to rollback transaction', error);
    }
  }

  public async batch<T>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const { error } = await this.client.rpc('batch_operations', {
        table: tableName,
        operations: operations.map(op => ({
          type: op.type,
          data: op.data
        }))
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      this.logger.error('Failed to execute batch operations:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to execute batch operations', error);
    }
  }

  public async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    if (!this.initialized) {
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'Client not initialized');
    }

    try {
      const { data, error } = await this.client.rpc('execute_raw_query', {
        query,
        params
      });

      if (error) {
        throw error;
      }

      return data as R[];
    } catch (error) {
      this.logger.error('Failed to execute raw query:', error);
      throw createDatabaseError(DatabaseErrorCode.OPERATION_FAILED, 'Failed to execute raw query', error);
    }
  }
} 