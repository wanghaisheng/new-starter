import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import * as mockData from '@/core/lib/db/data';

export class MemoryDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: IDatabaseClient;

  constructor(private config: any) {
    this.dbClient = config.dbClient;
  }

  async initialize() {
    for (const [table, data] of Object.entries(mockData)) {
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
