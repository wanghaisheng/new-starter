import { IDataService } from '../types';
import { DatabaseConnection } from '@/core/lib/db/types/database.types';
import { logger } from '@/core/lib/logger';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export class SqliteDataService implements IDataService {
  private db: any;
  private config: DatabaseConnection;

  constructor(config: DatabaseConnection) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: this.config.path || './data/sqlite.db',
        driver: sqlite3.Database
      });
      logger.info('SQLite database initialized', { path: this.config.path });
    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error });
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.db) {
      await this.db.close();
      logger.info('SQLite database closed');
    }
  }

  async query<T>(collection: string, options: any): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${collection}`;
      const params: any[] = [];

      if (options.where) {
        const conditions = Object.entries(options.where)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options.orderBy) {
        const orders = Object.entries(options.orderBy)
          .map(([key, direction]) => `${key} ${direction}`);
        query += ` ORDER BY ${orders.join(', ')}`;
      }

      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await this.db.all(query, params);
      return result as T[];
    } catch (error) {
      logger.error('Failed to execute query', { error, collection, options });
      throw error;
    }
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    try {
      const result = await this.db.get(
        `SELECT * FROM ${collection} WHERE id = ?`,
        [id]
      );
      return result as T || null;
    } catch (error) {
      logger.error('Failed to get document', { error, collection, id });
      throw error;
    }
  }

  async create<T>(collection: string, data: T): Promise<T> {
    try {
      const entries = Object.entries(data as any);
      const columns = entries.map(([key]) => key).join(', ');
      const placeholders = entries.map(() => '?').join(', ');
      const values = entries.map(([, value]) => value);

      await this.db.run(
        `INSERT INTO ${collection} (${columns}) VALUES (${placeholders})`,
        values
      );

      return data;
    } catch (error) {
      logger.error('Failed to create document', { error, collection, data });
      throw error;
    }
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const entries = Object.entries(data as any);
      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = [...entries.map(([, value]) => value), id];

      await this.db.run(
        `UPDATE ${collection} SET ${setClause} WHERE id = ?`,
        values
      );

      const updated = await this.get<T>(collection, id);
      if (!updated) {
        throw new Error(`Document ${id} not found in collection ${collection}`);
      }
      return updated;
    } catch (error) {
      logger.error('Failed to update document', { error, collection, id, data });
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      await this.db.run(
        `DELETE FROM ${collection} WHERE id = ?`,
        [id]
      );
    } catch (error) {
      logger.error('Failed to delete document', { error, collection, id });
      throw error;
    }
  }

  async clear(collection: string): Promise<void> {
    try {
      await this.db.run(`DELETE FROM ${collection}`);
    } catch (error) {
      logger.error('Failed to clear collection', { error, collection });
      throw error;
    }
  }
} 