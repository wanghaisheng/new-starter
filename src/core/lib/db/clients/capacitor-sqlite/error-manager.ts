import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface ErrorManagerConfig {
  backupInterval: number; // 备份间隔（毫秒）
  maxBackups: number; // 最大备份数量
  autoRecover: boolean; // 是否自动恢复
}

export class SQLiteErrorManager {
  private db: SQLiteDBConnection;
  private config: ErrorManagerConfig;
  private backupTimer: NodeJS.Timeout | null = null;
  private readonly BACKUP_DIR = 'sqlite_backups';

  constructor(db: SQLiteDBConnection, config: ErrorManagerConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * 初始化错误管理器
   */
  async initialize(): Promise<void> {
    try {
      // 确保备份目录存在
      await this.ensureBackupDirectory();

      // 检查数据库完整性
      await this.checkDatabaseIntegrity();

      // 启动定时备份
      this.startBackupTimer();
    } catch (error) {
      console.error('Failed to initialize error manager:', error);
      throw error;
    }
  }

  /**
   * 确保备份目录存在
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: this.BACKUP_DIR,
        recursive: true,
        directory: Directory.Cache
      });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  /**
   * 检查数据库完整性
   */
  private async checkDatabaseIntegrity(): Promise<void> {
    try {
      const result = await this.db.query('PRAGMA integrity_check');
      if (result.values?.[0]?.integrity_check !== 'ok') {
        throw new Error('Database integrity check failed');
      }
    } catch (error) {
      console.error('Database integrity check failed:', error);
      if (this.config.autoRecover) {
        await this.recoverFromBackup();
      } else {
        throw error;
      }
    }
  }

  /**
   * 启动定时备份
   */
  private startBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.createBackup().catch(error => {
        console.error('Failed to create scheduled backup:', error);
      });
    }, this.config.backupInterval);
  }

  /**
   * 创建备份
   */
  async createBackup(): Promise<void> {
    try {
      // 生成备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `${this.BACKUP_DIR}/backup-${timestamp}.db`;

      // 获取数据库文件路径
      const dbPath = await this.getDatabasePath();

      // 复制数据库文件
      await Filesystem.copy({
        from: dbPath,
        to: backupFile,
        directory: Directory.Cache
      });

      // 清理旧备份
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * 获取数据库文件路径
   */
  private async getDatabasePath(): Promise<string> {
    try {
      // 使用默认数据库路径
      const result = await Filesystem.getUri({
        path: 'database.db',
        directory: Directory.Cache
      });
      return result.uri;
    } catch (error) {
      console.error('Failed to get database path:', error);
      throw error;
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      // 获取备份文件列表
      const result = await Filesystem.readdir({
        path: this.BACKUP_DIR,
        directory: Directory.Cache
      });

      if (!result.files) return;

      // 按修改时间排序
      const files = result.files
        .filter(file => file.name.startsWith('backup-') && file.name.endsWith('.db'))
        .sort((a, b) => {
          const timeA = a.mtime || 0;
          const timeB = b.mtime || 0;
          return timeB - timeA;
        });

      // 删除多余的备份
      for (let i = this.config.maxBackups; i < files.length; i++) {
        await Filesystem.deleteFile({
          path: `${this.BACKUP_DIR}/${files[i].name}`,
          directory: Directory.Cache
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * 从备份恢复
   */
  async recoverFromBackup(): Promise<void> {
    try {
      // 获取最新的备份
      const backups = await this.getBackupList();
      if (backups.length === 0) {
        throw new Error('No backup available for recovery');
      }

      const latestBackup = backups[0];
      const backupPath = `${this.BACKUP_DIR}/${latestBackup.name}`;

      // 获取数据库文件路径
      const dbPath = await this.getDatabasePath();

      // 复制备份文件到数据库位置
      await Filesystem.copy({
        from: backupPath,
        to: dbPath,
        directory: Directory.Cache
      });

      // 重新打开数据库连接
      await this.db.close();
      await this.db.open();

      // 再次检查数据库完整性
      await this.checkDatabaseIntegrity();
    } catch (error) {
      console.error('Failed to recover from backup:', error);
      throw error;
    }
  }

  /**
   * 获取备份列表
   */
  async getBackupList(): Promise<Array<{ name: string; size: number; modified: Date }>> {
    try {
      const result = await Filesystem.readdir({
        path: this.BACKUP_DIR,
        directory: Directory.Cache
      });

      if (!result.files) return [];

      return result.files
        .filter(file => file.name.startsWith('backup-') && file.name.endsWith('.db'))
        .map(file => ({
          name: file.name,
          size: file.size || 0,
          modified: new Date(file.mtime || 0)
        }))
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (error) {
      console.error('Failed to get backup list:', error);
      throw error;
    }
  }

  /**
   * 停止错误管理器
   */
  stop(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
} 