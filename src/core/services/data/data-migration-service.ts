import { DatabaseFactory } from '@/core/lib/db/factory';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { DataMigrationTool, MigrationResult } from '@/core/lib/db/tools/data-migration-tool';

/**
 * 数据迁移服务
 * 提供数据迁移相关的高级功能
 */
export class DataMigrationService {
  private static instance: DataMigrationService;
  private migrationTool: DataMigrationTool;
  private migrationInProgress: boolean = false;
  private migrationProgress: number = 0;
  private migrationMessage: string = '';
  private migrationResult: MigrationResult | null = null;

  private constructor() {
    this.migrationTool = DataMigrationTool.getInstance();
  }

  public static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * 获取迁移进度
   */
  public getMigrationStatus(): {
    inProgress: boolean;
    progress: number;
    message: string;
    result: MigrationResult | null;
  } {
    return {
      inProgress: this.migrationInProgress,
      progress: this.migrationProgress,
      message: this.migrationMessage,
      result: this.migrationResult
    };
  }

  /**
   * 从Mock数据迁移到本地数据库
   * @param options 迁移选项
   */
  public async migrateFromMockToLocal(options: {
    tables?: string[];
    mockDbType?: string;
    localDbType?: string;
  }): Promise<MigrationResult> {
    if (this.migrationInProgress) {
      throw new Error('已有迁移任务正在进行中');
    }

    try {
      this.migrationInProgress = true;
      this.migrationProgress = 0;
      this.migrationMessage = '准备开始数据迁移';
      this.migrationResult = null;

      // 执行迁移
      const result = await this.migrationTool.migrateFromMockToLocal({
        ...options,
        onProgress: (progress, message) => {
          this.migrationProgress = progress;
          this.migrationMessage = message;
          console.log(`迁移进度: ${progress}%, ${message}`);
        }
      });

      this.migrationResult = result;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('数据迁移失败:', errorMessage);
      
      const failedResult: MigrationResult = {
        success: false,
        error: errorMessage,
        tables: [],
        totalRecords: 0,
        migratedRecords: 0,
        failedRecords: 0
      };
      
      this.migrationResult = failedResult;
      return failedResult;
    } finally {
      this.migrationInProgress = false;
    }
  }

  /**
   * 从本地数据库迁移到云端数据库
   * @param options 迁移选项
   */
  public async migrateFromLocalToCloud(options: {
    tables?: string[];
    localDbType?: string;
    cloudDbType?: string;
  }): Promise<MigrationResult> {
    if (this.migrationInProgress) {
      throw new Error('已有迁移任务正在进行中');
    }

    try {
      this.migrationInProgress = true;
      this.migrationProgress = 0;
      this.migrationMessage = '准备开始数据迁移到云端';
      this.migrationResult = null;

      // 执行迁移
      const result = await this.migrationTool.migrateFromLocalToCloud({
        ...options,
        onProgress: (progress, message) => {
          this.migrationProgress = progress;
          this.migrationMessage = message;
          console.log(`迁移进度: ${progress}%, ${message}`);
        }
      });

      this.migrationResult = result;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('数据迁移到云端失败:', errorMessage);
      
      const failedResult: MigrationResult = {
        success: false,
        error: errorMessage,
        tables: [],
        totalRecords: 0,
        migratedRecords: 0,
        failedRecords: 0
      };
      
      this.migrationResult = failedResult;
      return failedResult;
    } finally {
      this.migrationInProgress = false;
    }
  }

  /**
   * 验证迁移结果
   * @param options 验证选项
   */
  public async validateMigration(options: {
    sourceDbType: string;
    targetDbType: string;
    tables: string[];
  }): Promise<boolean> {
    const { sourceDbType, targetDbType, tables } = options;

    try {
      // 创建源数据库和目标数据库客户端
      const sourceClient = await this.createDatabaseClient(sourceDbType);
      const targetClient = await this.createDatabaseClient(targetDbType);

      // 验证迁移结果
      const validationResult = await this.migrationTool.validateMigration(
        sourceClient,
        targetClient,
        tables
      );

      // 关闭数据库连接
      await sourceClient.close();
      await targetClient.close();

      return validationResult.success;
    } catch (error) {
      console.error('验证迁移结果失败:', error);
      return false;
    }
  }

  /**
   * 创建数据库客户端
   * @param dbType 数据库类型
   */
  private async createDatabaseClient(dbType: string): Promise<IDatabaseClient> {
    const client = DatabaseFactory.createClient(dbType, {
      name: process.env.NEXT_PUBLIC_DB_NAME || 'app_database',
      version: parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10),
      engine: dbType as any
    });

    await client.initialize();
    return client;
  }
}