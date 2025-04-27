import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * db schema 初始化适配器（支持 ORM 自动建表/migration 或 SQL 文件批量建表）
 */
export class SchemaDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: IDatabaseClient;
  private sqlDir?: string;

  constructor(private config: any) {
    this.dbClient = config.dbClient;
    this.sqlDir = config.sqlDir;
  }

  async initialize() {
    if (this.sqlDir) {
      // SQL 文件批量建表
      const files = await fs.readdir(this.sqlDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const sql = await fs.readFile(path.join(this.sqlDir, file), 'utf8');
          if (typeof (this.dbClient as any).execRawQuery === 'function') {
            await (this.dbClient as any).execRawQuery(sql);
          } else {
            throw new Error('[SchemaDataInitializerAdapter] dbClient 不支持 execRawQuery 方法');
          }
        }
      }
      return;
    }
    // ORM 自动建表/迁移
    if (typeof (this.dbClient as any).initSchema === 'function') {
      await (this.dbClient as any).initSchema();
    } else if (typeof (this.dbClient as any).migrate === 'function') {
      await (this.dbClient as any).migrate();
    } else {
      throw new Error('[SchemaDataInitializerAdapter] dbClient 不支持 schema 初始化方法');
    }
  }

  getClient() {
    return this.dbClient;
  }
}
