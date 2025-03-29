import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface PerformanceConfig {
  batchSize: number;
  cacheSize: number;
  queryTimeout: number;
  enableWAL: boolean;
}

export class SQLitePerformanceManager {
  private db: SQLiteDBConnection;
  private config: PerformanceConfig;
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private lastMaintenance: number = 0;
  private readonly MAINTENANCE_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

  constructor(db: SQLiteDBConnection, config: PerformanceConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * 初始化性能管理器
   */
  async initialize(): Promise<void> {
    try {
      // 启用 WAL 模式
      if (this.config.enableWAL) {
        await this.db.execute('PRAGMA journal_mode = WAL');
      }

      // 设置缓存大小
      await this.db.execute(`PRAGMA cache_size = ${this.config.cacheSize}`);

      // 设置页面大小
      await this.db.execute('PRAGMA page_size = 4096');

      // 启用外键约束
      await this.db.execute('PRAGMA foreign_keys = ON');

      // 设置同步模式
      await this.db.execute('PRAGMA synchronous = NORMAL');

      // 设置临时存储
      await this.db.execute('PRAGMA temp_store = MEMORY');

      // 设置内存映射
      await this.db.execute('PRAGMA mmap_size = 30000000000');

      // 设置自动清理
      await this.db.execute('PRAGMA auto_vacuum = INCREMENTAL');
      await this.db.execute('PRAGMA incremental_vacuum = 1000');
    } catch (error) {
      console.error('Failed to initialize performance manager:', error);
      throw error;
    }
  }

  /**
   * 优化查询
   */
  async optimizeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      // 检查缓存
      const cacheKey = this.getCacheKey(query, params);
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.queryTimeout) {
        return cached.data;
      }

      // 执行查询
      const result = await this.db.query(query, params);

      // 更新缓存
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // 清理过期缓存
      this.cleanupCache();

      return result;
    } catch (error) {
      console.error('Failed to optimize query:', error);
      throw error;
    }
  }

  /**
   * 优化批量操作
   */
  async optimizeBatch(set: { statement: string; values: any[] }[]): Promise<void> {
    try {
      // 开始事务
      await this.db.execute('BEGIN TRANSACTION');

      // 分批执行
      for (let i = 0; i < set.length; i += this.config.batchSize) {
        const batch = set.slice(i, i + this.config.batchSize);
        await this.db.executeSet(batch);
      }

      // 提交事务
      await this.db.execute('COMMIT');

      // 执行维护
      await this.performMaintenance();
    } catch (error) {
      // 回滚事务
      await this.db.execute('ROLLBACK');
      console.error('Failed to optimize batch:', error);
      throw error;
    }
  }

  /**
   * 执行数据库维护
   */
  private async performMaintenance(): Promise<void> {
    const now = Date.now();
    if (now - this.lastMaintenance < this.MAINTENANCE_INTERVAL) {
      return;
    }

    try {
      // 分析数据库
      await this.db.execute('ANALYZE');

      // 重建索引
      await this.db.execute('REINDEX');

      // 清理缓存
      this.cleanupCache();

      this.lastMaintenance = now;
    } catch (error) {
      console.error('Failed to perform maintenance:', error);
      throw error;
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.queryCache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > this.config.queryTimeout) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(query: string, params: any[]): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this.queryCache.clear();
  }
} 