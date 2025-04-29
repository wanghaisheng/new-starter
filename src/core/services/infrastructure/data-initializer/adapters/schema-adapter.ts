import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
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

  async initialize(options?: { mode?: 'structure' | 'full'; tables?: string[]; reset?: boolean }) {
    // options.mode: 'structure' 仅建表, 'full' 建表+默认数据
    // options.tables: 指定表名
    // options.reset: true=重置(清空), false=增量
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
      // SQL 脚本不支持默认数据导入（如需支持可扩展）
      return;
    }
    // ORM 自动建表/迁移
    if (typeof (this.dbClient as any).initSchema === 'function') {
      await (this.dbClient as any).initSchema(options?.tables);
    } else if (typeof (this.dbClient as any).migrate === 'function') {
      await (this.dbClient as any).migrate(options?.tables);
    } else {
      throw new Error('[SchemaDataInitializerAdapter] dbClient 不支持 schema 初始化方法');
    }
    // 默认数据导入
    if (options?.mode === 'full' && typeof (this.dbClient as any).importDefaultData === 'function') {
      await (this.dbClient as any).importDefaultData(options?.tables, options?.reset);
    }
  }

  getClient() {
    return this.dbClient;
  }
}
