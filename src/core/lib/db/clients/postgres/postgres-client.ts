import type { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database-error';
import { Logger } from '@/core/lib/utils/logger';
import { Pool, PoolClient } from 'pg';

/**
 * PostgreSQL客户端配置
 */
export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

/**
 * PostgreSQL数据库客户端
 */
export class PostgresClient {
  private pool: Pool;
  private config: PostgresConfig;
  private logger: Logger;
  private initialized: boolean = false;
  private transaction: PoolClient | null = null;

  constructor(config: PostgresConfig) {
    this.config = config;
    this.logger = new Logger('PostgresClient');
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  public async connect(): Promise<void> {
    if (!this.initialized) {
      await this.pool.connect();
      this.initialized = true;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.initialized) {
      await this.pool.end();
      this.initialized = false;
    }
  }

  public async initialize(): Promise<void> {
    try {
      await this.pool.connect();
      this.initialized = true;
      this.logger.info('PostgreSQL client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL client:', error);
      throw new DatabaseError(
        'Failed to initialize PostgreSQL client',
        DatabaseErrorCode.INITIALIZATION_ERROR,
        error
      );
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    this.initialized = false;
  }

  public async clear(): Promise<void> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      
      for (const row of result.rows) {
        await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      }
      
      client.release();
    } catch (error) {
      this.logger.error('Failed to clear database:', error);
      throw new DatabaseError(
        'Failed to clear database',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      const result = await this.pool.query(
        `SELECT * FROM "${tableName}" WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to find record by id ${id} in collection ${tableName}:`, error);
      throw new DatabaseError(
        `Failed to find record by id ${id}`,
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      let sql = `SELECT * FROM "${tableName}"`;
      const values: any[] = [];
      let paramCount = 1;
      
      if (filter) {
        const conditions = Object.entries(filter).map(([key, value]) => {
          values.push(value);
          return `${key} = $${paramCount++}`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.pool.query(sql, values);
      return result.rows;
    } catch (error) {
      this.logger.error(`Failed to find records in collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to find records',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async create(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      const columns = Object.keys(data).map(col => `"${col}"`).join(', ');
      const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);

      const result = await this.pool.query(
        `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      this.logger.error(`Failed to create record in collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to create record',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      const updates = Object.entries(data).map(([key, _], i) => `"${key}" = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id];

      await this.pool.query(
        `UPDATE "${tableName}" SET ${updates} WHERE id = $${values.length}`,
        values
      );
    } catch (error) {
      this.logger.error(`Failed to update record ${id} in collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to update record',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async delete(tableName: string, id: string): Promise<void> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      await this.pool.query(
        `DELETE FROM "${tableName}" WHERE id = $1`,
        [id]
      );
    } catch (error) {
      this.logger.error(`Failed to delete record ${id} from collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to delete record',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      let sql = `SELECT * FROM "${tableName}"`;
      const values: any[] = [];
      let paramCount = 1;

      // Apply filters
      if (options.where) {
        const conditions = Object.entries(options.where).map(([key, value]) => {
          values.push(value);
          return `"${key}" = $${paramCount++}`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Apply sorting
      if (options.orderBy) {
        sql += ` ORDER BY "${options.orderBy.field}" ${options.orderBy.direction}`;
      }

      // Apply pagination
      if (options.limit) {
        sql += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
        if (options.offset) {
          sql += ` OFFSET $${paramCount++}`;
          values.push(options.offset);
        }
      }

      const result = await this.pool.query(sql, values);
      const count = await this.count(tableName, options.where);

      return {
        data: result.rows,
        total: count,
        hasMore: options.limit ? result.rows.length >= options.limit : false
      };
    } catch (error) {
      this.logger.error(`Failed to execute query on collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to execute query',
        DatabaseErrorCode.QUERY_ERROR,
        error
      );
    }
  }

  public async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      let sql = `SELECT COUNT(*) as count FROM "${tableName}"`;
      const values: any[] = [];
      let paramCount = 1;
      
      if (filter) {
        const conditions = Object.entries(filter).map(([key, value]) => {
          values.push(value);
          return `"${key}" = $${paramCount++}`;
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.pool.query(sql, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      this.logger.error(`Failed to count records in collection ${tableName}:`, error);
      throw new DatabaseError(
        'Failed to count records',
        DatabaseErrorCode.QUERY_ERROR,
        error
      );
    }
  }

  public async beginTransaction(): Promise<void> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      this.transaction = await this.pool.connect();
      await this.transaction.query('BEGIN');
    } catch (error) {
      this.logger.error('Failed to begin transaction:', error);
      throw new DatabaseError(
        'Failed to begin transaction',
        DatabaseErrorCode.TRANSACTION_ERROR,
        error
      );
    }
  }

  public async commitTransaction(): Promise<void> {
    if (!this.transaction) {
      throw new DatabaseError(
        'No active transaction',
        DatabaseErrorCode.NO_ACTIVE_TRANSACTION
      );
    }

    try {
      await this.transaction.query('COMMIT');
      this.transaction.release();
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to commit transaction:', error);
      throw new DatabaseError(
        'Failed to commit transaction',
        DatabaseErrorCode.TRANSACTION_COMMIT_ERROR,
        error
      );
    }
  }

  public async rollbackTransaction(): Promise<void> {
    if (!this.transaction) {
      throw new DatabaseError(
        'No active transaction',
        DatabaseErrorCode.NO_ACTIVE_TRANSACTION
      );
    }

    try {
      await this.transaction.query('ROLLBACK');
      this.transaction.release();
      this.transaction = null;
    } catch (error) {
      this.logger.error('Failed to rollback transaction:', error);
      throw new DatabaseError(
        'Failed to rollback transaction',
        DatabaseErrorCode.TRANSACTION_ROLLBACK_ERROR,
        error
      );
    }
  }

  public async batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
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
      throw new DatabaseError(
        'Failed to execute batch operations',
        DatabaseErrorCode.OPERATION_FAILED,
        error
      );
    }
  }

  public async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    if (!this.initialized) {
      throw new DatabaseError(
        'Client not initialized',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }

    try {
      const result = await this.pool.query(query, params);
      return result.rows as R[];
    } catch (error) {
      this.logger.error('Failed to execute raw query:', error);
      throw new DatabaseError(
        'Failed to execute raw query',
        DatabaseErrorCode.QUERY_ERROR,
        error
      );
    }
  }
}