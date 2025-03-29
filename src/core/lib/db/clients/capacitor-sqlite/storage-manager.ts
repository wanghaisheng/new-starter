import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StorageStats } from '../../../../types/database.types';

export interface StorageConfig {
  maxSize: number; // 最大存储空间（字节）
  cleanupThreshold: number; // 清理阈值（百分比）
  retentionDays: number; // 数据保留天数
}

export class SQLiteStorageManager {
  private db: SQLiteDBConnection;
  private config: StorageConfig;
  private currentSize: number = 0;

  constructor(db: SQLiteDBConnection, config: StorageConfig) {
    this.db = db;
    this.config = config;
  }

  /**
   * 获取数据库存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
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

      // 清理过期的消息
      await this.db.execute(`DELETE FROM messages WHERE createdAt < '${cutoffDateStr}'`);

      // 清理过期的匹配记录
      await this.db.execute(`DELETE FROM matches WHERE createdAt < '${cutoffDateStr}'`);

      // 清理未匹配的用户
      await this.db.execute(
        `DELETE FROM users WHERE id NOT IN (
          SELECT DISTINCT userId FROM matches
          UNION
          SELECT DISTINCT matchedUserId FROM matches
        ) AND createdAt < '${cutoffDateStr}'`
      );

      // 压缩数据库
      await this.vacuum();

      this.currentSize = 0;
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
    return this.config.maxSize - this.currentSize;
  }

  /**
   * 检查存储空间是否足够
   */
  async hasEnoughSpace(requiredSize: number): Promise<boolean> {
    const availableSpace = await this.getAvailableSpace();
    const stats = await this.getStorageStats();
    return availableSpace - stats.totalSize >= requiredSize;
  }

  async updateStorageSize(size: number): Promise<void> {
    this.currentSize = size;
  }
} 