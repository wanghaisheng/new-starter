import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StorageStats } from '@/core/lib/db/types/database';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database-error';
import type { DatabaseLogger } from '@/core/lib/db/types/database-logger';
import { getDatabaseLogger } from '@/core/lib/db/types/database-logger';

export interface StorageConfig {
  maxSize: number; // 最大存储空间（字节）
  cleanupThreshold: number; // 清理阈值（百分比）
  retentionDays: number; // 数据保留天数
  dbFilePath: string; // 数据库文件相对路径（如 'appdb.db'），必须显式传递
}

export class SQLiteStorageManager {
  private db: SQLiteDBConnection;
  private config: StorageConfig;
  private currentSize: number = 0;

  constructor(db: SQLiteDBConnection, config: StorageConfig) {
    this.db = db;
    this.config = config;
    if (!config.dbFilePath) {
      throw new Error('StorageConfig.dbFilePath is required!');
    }
  }

  /**
   * 获取数据库存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const stat = await Filesystem.stat({
        path: this.config.dbFilePath,
        directory: Directory.Data
      });
      this.currentSize = stat.size ?? 0;
    } catch (error) {
      // 获取失败则兜底
      this.currentSize = 0;
    }
    return {
      totalSize: this.config.maxSize,
      availableSpace: this.config.maxSize - this.currentSize,
      usedSpace: this.currentSize
    };
  }

  /**
   * 检查是否需要清理数据
   */
  async checkStorageStatus(): Promise<boolean> {
    return this.currentSize > this.config.maxSize * this.config.cleanupThreshold;
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      const cutoffDateStr = cutoffDate.toISOString();
      // 由于 db.execute 不支持参数数组，直接拼接 SQL
      await this.db.execute(`DELETE FROM messages WHERE createdAt < '${cutoffDateStr}'`);
      await this.db.execute(`DELETE FROM matches WHERE createdAt < '${cutoffDateStr}'`);
      await this.db.execute(
        `DELETE FROM users WHERE id NOT IN (
          SELECT DISTINCT userId FROM matches
          UNION
          SELECT DISTINCT matchedUserId FROM matches
        ) AND createdAt < '${cutoffDateStr}'`
      );
      await this.vacuum();
      await this.getStorageStats();
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      throw error;
    }
  }

  /**
   * 压缩数据库
   */
  async vacuum(): Promise<void> {
    try {
      await this.db.execute('VACUUM');
    } catch (error) {
      console.error('Failed to vacuum database:', error);
      throw error;
    }
  }

  /**
   * 获取可用存储空间
   */
  async getAvailableSpace(): Promise<number> {
    await this.getStorageStats();
    return this.config.maxSize - this.currentSize;
  }

  /**
   * 检查存储空间是否足够
   */
  async hasEnoughSpace(requiredSize: number): Promise<boolean> {
    return this.currentSize + requiredSize <= this.config.maxSize;
  }

  /**
   * 更新当前存储使用量
   */
  async updateStorageSize(size: number): Promise<void> {
    this.currentSize = size;
  }
}