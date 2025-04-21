import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { DataMigrationService, DataMigrationConfig, MigrationProgress } from '../migration/data-migration-service';

// 1. 初始化源/目标 HybridDatabaseClient（可用 mock 或实际配置）
const source = new HybridDatabaseClient({ /* mock/config for source */ });
const target = new HybridDatabaseClient({ /* mock/config for target */ });

// 2. 配置迁移服务
const migrationConfig: DataMigrationConfig = {
  source,
  target,
  tables: ['users', 'messages', 'logs']
};

const migrationService = new DataMigrationService(migrationConfig);

// 3. 进度回调（模拟 UI 层进度展示）
const progressCallback = (progress: MigrationProgress) => {
  if (progress.status === 'migrating') {
    console.log(`[迁移] ${progress.table}: ${progress.migrated}/${progress.total}`);
  } else if (progress.status === 'success') {
    console.log(`[迁移] ${progress.table} 完成！`);
  } else if (progress.status === 'error') {
    console.error(`[迁移] ${progress.table} 失败:`, progress.error);
  }
};

// 4. 启动全表迁移
migrationService.migrateAll(progressCallback);

// 5. 查询单表迁移进度
setTimeout(() => {
  const usersProgress = migrationService.getProgress('users');
  console.log('[迁移] users 进度:', usersProgress);
}, 5000);
