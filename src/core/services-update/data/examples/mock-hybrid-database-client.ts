// 一个简单的 HybridDatabaseClient mock 实现，支持 query/insert
export class MockHybridDatabaseClient {
  private tables: Record<string, any[]> = {};

  constructor(initialData: Record<string, any[]> = {}) {
    this.tables = { ...initialData };
  }

  async query(table: string, options?: { limit?: number }): Promise<any[]> {
    const data = this.tables[table] || [];
    if (options?.limit) {
      return data.slice(0, options.limit);
    }
    return [...data];
  }

  async insert(table: string, row: any): Promise<void> {
    if (!this.tables[table]) this.tables[table] = [];
    this.tables[table].push(row);
  }

  // 可扩展 update/delete 等
}
