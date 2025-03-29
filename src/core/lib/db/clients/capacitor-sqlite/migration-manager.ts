import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface Migration {
  version: number;
  up: string[];
  down: string[];
}

export class SQLiteMigrationManager {
  private db: SQLiteDBConnection;
  private migrations: Migration[] = [];

  constructor(db: SQLiteDBConnection) {
    this.db = db;
  }

  /**
   * 添加迁移
   */
  addMigration(migration: Migration): void {
    this.migrations.push(migration);
    // 按版本号排序
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * 初始化迁移表
   */
  private async initializeMigrationTable(): Promise<void> {
    try {
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        )
      `);
    } catch (error) {
      console.error('Failed to initialize migration table:', error);
      throw error;
    }
  }

  /**
   * 获取已应用的迁移版本
   */
  private async getAppliedMigrations(): Promise<number[]> {
    try {
      const result = await this.db.query('SELECT version FROM migrations ORDER BY version');
      return result.values?.map(row => row.version) || [];
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      throw error;
    }
  }

  /**
   * 记录迁移应用
   */
  private async recordMigration(version: number): Promise<void> {
    try {
      await this.db.execute(
        'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
        [version, new Date().toISOString()]
      );
    } catch (error) {
      console.error('Failed to record migration:', error);
      throw error;
    }
  }

  /**
   * 执行迁移
   */
  async migrate(): Promise<void> {
    try {
      // 初始化迁移表
      await this.initializeMigrationTable();

      // 获取已应用的迁移
      const appliedMigrations = await this.getAppliedMigrations();
      const lastAppliedVersion = appliedMigrations.length > 0
        ? Math.max(...appliedMigrations)
        : 0;

      // 获取需要应用的迁移
      const pendingMigrations = this.migrations.filter(
        migration => migration.version > lastAppliedVersion
      );

      // 应用每个待处理的迁移
      for (const migration of pendingMigrations) {
        try {
          // 开始事务
          await this.db.execute('BEGIN TRANSACTION');

          // 执行迁移
          for (const sql of migration.up) {
            await this.db.execute(sql);
          }

          // 记录迁移
          await this.recordMigration(migration.version);

          // 提交事务
          await this.db.execute('COMMIT');
        } catch (error) {
          // 回滚事务
          await this.db.execute('ROLLBACK');
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to execute migrations:', error);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  async rollback(steps: number = 1): Promise<void> {
    try {
      // 获取已应用的迁移
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.length === 0) return;

      // 获取要回滚的迁移
      const versionsToRollback = appliedMigrations
        .sort((a, b) => b - a)
        .slice(0, steps);

      // 回滚每个迁移
      for (const version of versionsToRollback) {
        const migration = this.migrations.find(m => m.version === version);
        if (!migration) continue;

        try {
          // 开始事务
          await this.db.execute('BEGIN TRANSACTION');

          // 执行回滚
          for (const sql of migration.down) {
            await this.db.execute(sql);
          }

          // 删除迁移记录
          await this.db.execute('DELETE FROM migrations WHERE version = ?', [version]);

          // 提交事务
          await this.db.execute('COMMIT');
        } catch (error) {
          // 回滚事务
          await this.db.execute('ROLLBACK');
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to rollback migrations:', error);
      throw error;
    }
  }

  /**
   * 重置数据库
   */
  async reset(): Promise<void> {
    try {
      // 获取所有已应用的迁移版本
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.length === 0) return;

      // 回滚所有迁移
      await this.rollback(appliedMigrations.length);

      // 重新应用所有迁移
      await this.migrate();
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }
} 