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
  private backupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(db: SQLiteDBConnection, config: BackupConfig) {
    this.db = db;
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureBackupDirectory();
      this.startBackupTimer();
    } catch (error) {
      console.error('Failed to initialize backup manager:', error);
      throw error;
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: this.config.backupPath,
        recursive: true,
        directory: Directory.Cache
      });
    } catch (error) {
      // 目录已存在时忽略
      if (!(`${error}`.includes('Directory exists'))) {
        console.error('Failed to create backup directory:', error);
        throw error;
      }
    }
  }

  private startBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    this.backupTimer = setInterval(() => {
      this.createBackup().catch(error => {
        console.error('Scheduled backup failed:', error);
      });
    }, this.config.backupInterval);
  }

  async createBackup(): Promise<void> {
    try {
      const exportResult = await this.db.exportToJson('full');
      const backupFileName = `backup_${Date.now()}.json`;
      const backupPath = `${this.config.backupPath}/${backupFileName}`;
      await Filesystem.writeFile({
        path: backupPath,
        data: JSON.stringify(exportResult),
        directory: Directory.Cache,
        encoding: 'utf8'
      });
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await Filesystem.readdir({
        path: this.config.backupPath,
        directory: Directory.Cache
      });
      const backupFiles = files.files.filter(f => f.name.endsWith('.json'));
      if (backupFiles.length > this.config.maxBackups) {
        // 按时间排序，删除最旧
        const sorted = backupFiles.sort((a, b) => a.name.localeCompare(b.name));
        const toDelete = sorted.slice(0, backupFiles.length - this.config.maxBackups);
        for (const file of toDelete) {
          await Filesystem.deleteFile({
            path: `${this.config.backupPath}/${file.name}`,
            directory: Directory.Cache
          });
        }
      }
    } catch (error) {
      console.error('Cleanup old backups failed:', error);
    }
  }

  async stopBackup(): Promise<void> {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}