import { DatabaseErrorCode } from '@/core/lib/db/types/common';
import { createDatabaseError } from '@/core/lib/db/types/database';

import { databaseVersions, getLatestVersion, getUpgradeStatements, validateVersion } from './versions';

export class VersionManager {
  private static instance: VersionManager;
  private currentVersion: number = 0;
  private isUpgrading: boolean = false;

  private constructor() {}

  public static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  /**
   * 获取当前数据库版本
   */
  public getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * 设置当前数据库版本
   */
  public setCurrentVersion(version: number): void {
    if (!validateVersion(version)) {
      throw createDatabaseError(
        DatabaseErrorCode.UNKNOWN,
        `Invalid database version: ${version}`
      );
    }
    this.currentVersion = version;
  }

  /**
   * 检查是否需要升级
   */
  public needsUpgrade(): boolean {
    return this.currentVersion < getLatestVersion();
  }

  /**
   * 获取需要执行的升级语句
   */
  public getUpgradeStatements(): string[] {
    if (!this.needsUpgrade()) {
      return [];
    }
    return getUpgradeStatements(this.currentVersion, getLatestVersion());
  }

  /**
   * 开始升级过程
   */
  public startUpgrade(): void {
    if (this.isUpgrading) {
      throw createDatabaseError(
        DatabaseErrorCode.UPGRADE_IN_PROGRESS,
        'Database upgrade is already in progress'
      );
    }
    this.isUpgrading = true;
  }

  /**
   * 完成升级过程
   */
  public completeUpgrade(): void {
    if (!this.isUpgrading) {
      throw createDatabaseError(
        DatabaseErrorCode.NO_UPGRADE_IN_PROGRESS,
        'No database upgrade is in progress'
      );
    }
    this.currentVersion = getLatestVersion();
    this.isUpgrading = false;
  }

  /**
   * 回滚升级过程
   */
  public rollbackUpgrade(): void {
    if (!this.isUpgrading) {
      throw createDatabaseError(
        DatabaseErrorCode.NO_UPGRADE_IN_PROGRESS,
        'No database upgrade is in progress'
      );
    }
    this.isUpgrading = false;
  }

  /**
   * 获取所有版本定义
   */
  public getAllVersions() {
    return databaseVersions;
  }

  /**
   * 获取指定版本的升级语句
   */
  public getVersionStatements(version: number): string[] {
    const versionDef = databaseVersions.find(v => v.version === version);
    if (!versionDef) {
      throw createDatabaseError(
        DatabaseErrorCode.VERSION_NOT_FOUND,
        `Version ${version} not found`
      );
    }
    return versionDef.statements;
  }
}