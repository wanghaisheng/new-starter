import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { BaseClient } from '@/core/lib/db/clients/base-client';

export interface JsonDataInitializerSource {
  [table: string]: any[];
}

export class JsonDataInitializerAdapter implements IDataInitializerAdapter {
  private dbClient: BaseClient;
  private dataSource: JsonDataInitializerSource;

  /**
   * @param config
   *   dbClient: BaseClient
   *   jsonData: object  // 直接传入的 JSON 数据对象
   */
  constructor(private config: any) {
    this.dbClient = config.dbClient;
    this.dataSource = config.jsonData || {};
  }

  async initialize(options?: { mode?: 'structure' | 'full'; tables?: string[]; reset?: boolean }) {
    const json = this.dataSource;
    const tables = options?.tables || Object.keys(json);
    for (const table of tables) {
      if (!(table in json)) continue;
      if (options?.mode === 'structure') {
        // 仅建表（假定 dbClient 支持 createTable）
        if (typeof (this.dbClient as any).createTable === 'function') {
          await (this.dbClient as any).createTable(table);
        }
        continue;
      }
      // full 模式：结构+数据
      if (options?.reset !== false && typeof this.dbClient.clear === 'function') {
        await this.dbClient.clear(table);
      }
      for (const row of (json[table] as any[])) {
        await this.dbClient.create(table, row);
      }
    }
  }

  getClient() {
    return this.dbClient;
  }
}
