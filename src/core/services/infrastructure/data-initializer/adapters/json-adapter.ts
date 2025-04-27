import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { existsSync } from 'fs';

export class JsonDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: IDatabaseClient;
  private filePath: string;

  constructor(private config: any) {
    this.dbClient = config.dbClient;
    this.filePath = config.jsonFilePath || './mock-data.json';
  }

  async initialize() {
    if (!existsSync(this.filePath)) throw new Error(`JSON file not found: ${this.filePath}`);
    const json = require(this.filePath);
    for (const [table, data] of Object.entries(json)) {
      await this.dbClient.clear(table);
      for (const row of data as any[]) {
        await this.dbClient.create(table, row);
      }
    }
  }

  getClient() {
    return this.dbClient;
  }
}
