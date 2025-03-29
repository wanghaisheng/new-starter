import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface BackupConfig {
  backupInterval: number; // 备份间隔（毫秒）
  maxBackups: number; // 最大备份数量
  backupPath: string; // 备份文件路径
}

export class SQLiteBackupManager {
  private db: SQLiteDBConnection;
  private config: BackupConfig;
  private backupTimer: NodeJS.Timeout | null = null;

  constructor(db: SQLiteDBConnection, config: BackupConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * 初始化备份管理器
   */
  async initialize(): Promise<void> {
    try {
      // 确保备份目录存在
      await this.ensureBackupDirectory();

      // 启动定时备份
      this.startBackupTimer();
    } catch (error) {
      console.error('Failed to initialize backup manager:', error);
      throw error;
    }
  }

  /**
   * 确保备份目录存在
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: this.config.backupPath,
        recursive: true,
        directory: Directory.Cache
      });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
      throw error;
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
      const backupFile = `${this.config.backupPath}/backup-${timestamp}.db`;

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
      const result = await Filesystem.getUri({
        path: this.db.database,
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
        path: this.config.backupPath,
        directory: Directory.Cache
      });

      if (!result.files) return;

      // 按修改时间排序
      const files = result.files
        .filter(file => file.name.startsWith('backup-') && file.name.endsWith('.db'))
        .sort((a, b) => new Date(b.modificationTime).getTime() - new Date(a.modificationTime).getTime());

      // 删除多余的备份
      for (let i = this.config.maxBackups; i < files.length; i++) {
        await Filesystem.deleteFile({
          path: `${this.config.backupPath}/${files[i].name}`,
          directory: Directory.Cache
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupFile: string): Promise<void> {
    try {
      // 获取数据库文件路径
      const dbPath = await this.getDatabasePath();

      // 复制备份文件到数据库位置
      await Filesystem.copy({
        from: backupFile,
        to: dbPath,
        directory: Directory.Cache
      });

      // 重新打开数据库连接
      await this.db.close();
      await this.db.open();
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * 获取备份列表
   */
  async getBackupList(): Promise<Array<{ name: string; size: number; modified: Date }>> {
    try {
      const result = await Filesystem.readdir({
        path: this.config.backupPath,
        directory: Directory.Cache
      });

      if (!result.files) return [];

      return result.files
        .filter(file => file.name.startsWith('backup-') && file.name.endsWith('.db'))
        .map(file => ({
          name: file.name,
          size: file.size,
          modified: new Date(file.modificationTime)
        }))
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (error) {
      console.error('Failed to get backup list:', error);
      throw error;
    }
  }

  /**
   * 清理所有备份
   */
  async cleanupAllBackups(): Promise<void> {
    try {
      const result = await Filesystem.readdir({
        path: this.config.backupPath,
        directory: Directory.Cache
      });

      if (!result.files) return;

      for (const file of result.files) {
        if (file.name.startsWith('backup-') && file.name.endsWith('.db')) {
          await Filesystem.deleteFile({
            path: `${this.config.backupPath}/${file.name}`,
            directory: Directory.Cache
          });
        }
      }
    } catch (error) {
      console.error('Failed to cleanup all backups:', error);
      throw error;
    }
  }

  /**
   * 停止备份管理器
   */
  stop(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
} 