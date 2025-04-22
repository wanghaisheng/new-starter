import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { createDatabaseClient } from '@/core/lib/db/clients/factory';
import { promises as fs } from 'fs';
import path from 'path';

export class SqlDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: IDatabaseClient;
  private sqlDir: string;

  constructor(private config: any) {
    this.dbClient = createDatabaseClient('mock', config);
    this.sqlDir = config.sqlDir || './mock-sql';
  }

  async initialize() {
    // 这里只做伪实现，实际应遍历 sqlDir 下所有 .sql 文件并执行
    const files = await fs.readdir(this.sqlDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const sql = await fs.readFile(path.join(this.sqlDir, file), 'utf8');
        // 假设 dbClient 支持 execRawQuery
        if (typeof (this.dbClient as any).execRawQuery === 'function') {
          await (this.dbClient as any).execRawQuery(sql);
        }
      }
    }
  }

  getClient() {
    return this.dbClient;
  }
}
