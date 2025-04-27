import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { promises as fs } from 'fs';
import path from 'path';

export class SqlDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: IDatabaseClient;
  private sqlDir: string;

  constructor(private config: any) {
    this.dbClient = config.dbClient;
    this.sqlDir = config.sqlDir || './mock-sql';
  }

  async initialize() {
    const files = await fs.readdir(this.sqlDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const sql = await fs.readFile(path.join(this.sqlDir, file), 'utf8');
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
