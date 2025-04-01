/**
 * 数据迁移配置文件
 * 定义数据迁移的配置选项和步骤
 */

// 迁移环境类型
export enum MigrationEnvironment {
  MOCK = 'mock',
  LOCAL = 'local',
  PRODUCTION = 'production'
}

// 数据库类型
export enum DatabaseType {
  MOCK = 'mock',
  MOCK_INDEXEDDB = 'mock-indexeddb',
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite',
  CAPACITOR_SQLITE = 'capacitor-sqlite',
  FIREBASE = 'firebase',
  SUPABASE = 'supabase',
  CLOUDFLARE_D1 = 'cloudflare_d1'
}

// 迁移配置接口
export interface MigrationConfig {
  // 源环境
  sourceEnvironment: MigrationEnvironment;
  // 目标环境
  targetEnvironment: MigrationEnvironment;
  // 源数据库类型
  sourceDatabaseType: DatabaseType;
  // 目标数据库类型
  targetDatabaseType: DatabaseType;
  // 要迁移的表
  tables?: string[];
  // 是否清空目标表
  clearTargetTables?: boolean;
  // 是否验证迁移结果
  validateAfterMigration?: boolean;
  // 是否保留源数据
  preserveSourceData?: boolean;
  // 批处理大小
  batchSize?: number;
  // 超时时间（毫秒）
  timeout?: number;
  // 重试次数
  retryCount?: number;
  // 重试间隔（毫秒）
  retryInterval?: number;
}

// 默认迁移配置
export const defaultMigrationConfig: MigrationConfig = {
  sourceEnvironment: MigrationEnvironment.MOCK,
  targetEnvironment: MigrationEnvironment.LOCAL,
  sourceDatabaseType: DatabaseType.MOCK_INDEXEDDB,
  targetDatabaseType: DatabaseType.INDEXEDDB,
  clearTargetTables: true,
  validateAfterMigration: true,
  preserveSourceData: true,
  batchSize: 100,
  timeout: 60000,
  retryCount: 3,
  retryInterval: 1000
};

// Mock到本地的迁移配置
export const mockToLocalConfig: MigrationConfig = {
  ...defaultMigrationConfig,
  sourceEnvironment: MigrationEnvironment.MOCK,
  targetEnvironment: MigrationEnvironment.LOCAL,
  sourceDatabaseType: DatabaseType.MOCK_INDEXEDDB,
  targetDatabaseType: DatabaseType.INDEXEDDB
};

// 本地到生产的迁移配置
export const localToProductionConfig: MigrationConfig = {
  ...defaultMigrationConfig,
  sourceEnvironment: MigrationEnvironment.LOCAL,
  targetEnvironment: MigrationEnvironment.PRODUCTION,
  sourceDatabaseType: DatabaseType.INDEXEDDB,
  targetDatabaseType: DatabaseType.FIREBASE,
  clearTargetTables: false,
  preserveSourceData: true
};

// 迁移步骤
export const migrationSteps = {
  // 从Mock到本地的迁移步骤
  mockToLocal: [
    '验证源数据库连接',
    '验证目标数据库连接',
    '获取源数据库表结构',
    '创建目标数据库表结构',
    '清空目标数据库表（如果配置为清空）',
    '读取源数据库数据',
    '转换数据格式',
    '写入目标数据库',
    '验证迁移结果（如果配置为验证）',
    '关闭数据库连接'
  ],
  
  // 从本地到生产的迁移步骤
  localToProduction: [
    '验证源数据库连接',
    '验证目标数据库连接',
    '验证用户权限',
    '获取源数据库表结构',
    '验证目标数据库表结构',
    '读取源数据库数据',
    '转换数据格式',
    '写入目标数据库',
    '验证迁移结果（如果配置为验证）',
    '关闭数据库连接'
  ]
};

// 迁移验证方法
export const migrationValidationMethods = {
  // 记录数验证
  recordCount: '验证源数据库和目标数据库的记录数是否一致',
  // ID验证
  idValidation: '验证所有源数据库的记录ID在目标数据库中是否存在',
  // 数据完整性验证
  dataIntegrity: '验证关键字段的数据是否一致',
  // 关系验证
  relationshipValidation: '验证表之间的关系是否保持一致',
  // 性能验证
  performanceValidation: '验证目标数据库的查询性能'
};