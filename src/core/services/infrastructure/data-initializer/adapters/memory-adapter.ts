import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import * as mockData from '@/core/lib/db/types/__mocks__/mock-data';

export class MemoryDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: BaseClient;

  constructor(private config: any) {
    this.dbClient = config.dbClient;
  }

  async initialize(options?: { mode?: 'structure' | 'full'; tables?: string[]; reset?: boolean }) {
    const tables = options?.tables || Object.keys(mockData);
    for (const table of tables) {
      if (!(table in mockData)) continue;
      if (options?.mode === 'structure') {
        if (typeof (this.dbClient as any).createTable === 'function') {
          await (this.dbClient as any).createTable(table);
        }
        continue;
      }
      if (options?.reset !== false && typeof this.dbClient.clear === 'function') {
        await this.dbClient.clear();
      }
      for (const row of (mockData as any)[table]) {
        await this.dbClient.create(table, row);
      }
    }
  }

  getClient() {
    return this.dbClient;
  }
}
