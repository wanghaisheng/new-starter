import { DatabaseFactory } from '@/core/lib/db/factory';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { schemaRegistry } from '@/core/lib/db/schema';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { BaseEntity } from '@/core/lib/db/types/base-entity';



/**
 * 数据迁移工具
 * 用于在不同数据库环境之间迁移数据
 */
export class DataMigrationTool {
  private static instance: DataMigrationTool;

  private constructor() {}

  public static getInstance(): DataMigrationTool {
    if (!DataMigrationTool.instance) {
      DataMigrationTool.instance = new DataMigrationTool();
    }
    return DataMigrationTool.instance;
  }

  /**
   * 从Mock数据迁移到本地数据库
   * @param options 迁移选项
   */
  public async migrateFromMockToLocal(options: {
    mockDbType?: string;
    localDbType?: string;
    tables?: string[];
    onProgress?: (progress: number, message: string) => void;
  }): Promise<MigrationResult> {
    const {
      mockDbType = 'mock-indexeddb',
      localDbType = 'indexeddb',
      tables,
      onProgress = () => {}
    } = options;

    try {
      // 创建源数据库客户端（Mock）
      const sourceClient = DatabaseFactory.createClient(mockDbType, {
        name: process.env.NEXT_PUBLIC_DB_NAME || 'app_database_mock',
        version: parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10),
        engine: mockDbType as any
      });

      // 创建目标数据库客户端（本地）
      const targetClient = DatabaseFactory.createClient(localDbType, {
        name: process.env.NEXT_PUBLIC_DB_NAME || 'app_database_local',
        version: parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10),
        engine: localDbType as any
      });

      // 初始化数据库连接
      await sourceClient.initialize();
      await targetClient.initialize();

      onProgress(10, '数据库连接初始化完成');

      // 获取要迁移的表
      const allSchemas = schemaRegistry.getAllSchemas();
      const schemasToMigrate = tables
        ? allSchemas.filter(schema => tables.includes(schema.name))
        : allSchemas;

      if (schemasToMigrate.length === 0) {
        throw new Error('没有找到要迁移的表');
      }

      onProgress(20, `准备迁移 ${schemasToMigrate.length} 个表`);

      // 迁移每个表的数据
      const results: TableMigrationResult[] = [];
      let currentProgress = 20;
      const progressPerTable = 70 / schemasToMigrate.length;

      for (const schema of schemasToMigrate) {
        onProgress(currentProgress, `开始迁移表 ${schema.name}`);

        // 创建实体转换器
        const entityConverter = new EntityConverter(schema);

        // 获取源数据
        const sourceData = await sourceClient.findAll(schema.name);
        onProgress(
          currentProgress + progressPerTable * 0.3,
          `从源数据库读取了 ${sourceData.length} 条 ${schema.name} 记录`
        );

        // 清空目标表（可选，根据需要决定是否保留目标数据）
        await targetClient.clear(schema.name);
        onProgress(
          currentProgress + progressPerTable * 0.5,
          `已清空目标数据库的 ${schema.name} 表`
        );

        // 将数据写入目标数据库
        let successCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        for (const item of sourceData) {
          try {
            // 使用实体转换器处理数据格式
            const processedItem = entityConverter.fromDatabase(item);
            await targetClient.create(schema.name, processedItem);
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push({
              item,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        results.push({
          table: schema.name,
          totalRecords: sourceData.length,
          migratedRecords: successCount,
          failedRecords: errorCount,
          errors: errors.slice(0, 10) // 只保留前10个错误
        });

        currentProgress += progressPerTable;
        onProgress(
          currentProgress,
          `表 ${schema.name} 迁移完成，成功: ${successCount}，失败: ${errorCount}`
        );
      }

      // 关闭数据库连接
      await sourceClient.close();
      await targetClient.close();

      onProgress(100, '数据迁移完成');

      return {
        success: true,
        tables: results,
        totalRecords: results.reduce((sum, result) => sum + result.totalRecords, 0),
        migratedRecords: results.reduce((sum, result) => sum + result.migratedRecords, 0),
        failedRecords: results.reduce((sum, result) => sum + result.failedRecords, 0)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tables: [],
        totalRecords: 0,
        migratedRecords: 0,
        failedRecords: 0
      };
    }
  }

  /**
   * 从本地数据库迁移到云端数据库
   * @param options 迁移选项
   */
  public async migrateFromLocalToCloud(options: {
    localDbType?: string;
    cloudDbType?: string;
    tables?: string[];
    onProgress?: (progress: number, message: string) => void;
  }): Promise<MigrationResult> {
    // 类似于 migrateFromMockToLocal 的实现
    // 但源是本地数据库，目标是云端数据库
    throw new Error('尚未实现从本地到云端的迁移');
  }

  /**
   * 验证迁移结果
   * @param sourceClient 源数据库客户端
   * @param targetClient 目标数据库客户端
   * @param tables 要验证的表
   */
  public async validateMigration(
    sourceClient: IDatabaseClient,
    targetClient: IDatabaseClient,
    tables: string[]
  ): Promise<ValidationResult> {
    const results: TableValidationResult[] = [];

    for (const table of tables) {
      // 获取源数据和目标数据
      const sourceData = await sourceClient.findAll(table);
      const targetData = await targetClient.findAll(table);

      // 比较记录数
      const countMatch = sourceData.length === targetData.length;

      // 比较数据内容（简化版，实际可能需要更复杂的比较逻辑）
      const sourceIds = new Set(sourceData.map((item: any) => item.id));
      const targetIds = new Set(targetData.map((item: any) => item.id));

      // 检查所有源ID是否都在目标中存在
      const missingIds = [...sourceIds].filter(id => !targetIds.has(id));

      results.push({
        table,
        sourceCount: sourceData.length,
        targetCount: targetData.length,
        countMatch,
        missingRecords: missingIds.length,
        missingIds: missingIds.slice(0, 10) // 只保留前10个缺失ID
      });
    }

    return {
      success: results.every(result => result.countMatch && result.missingRecords === 0),
      tables: results
    };
  }
}

/**
 * 迁移结果接口
 */
export interface MigrationResult {
  success: boolean;
  error?: string;
  tables: TableMigrationResult[];
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
}

/**
 * 表迁移结果接口
 */
export interface TableMigrationResult {
  table: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: any[];
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  success: boolean;
  tables: TableValidationResult[];
}

/**
 * 表验证结果接口
 */
export interface TableValidationResult {
  table: string;
  sourceCount: number;
  targetCount: number;
  countMatch: boolean;
  missingRecords: number;
  missingIds: string[];
}