import { MockHybridDatabaseClient } from './mock-hybrid-database-client';
import { DataMigrationService, DataMigrationConfig, MigrationProgress } from '../migration/data-migration-service';

// 1. 构造 mock 数据
const source = new MockHybridDatabaseClient({
  users: Array.from({ length: 120 }, (_, i) => ({ id: i + 1, name: `User${i + 1}` })),
  messages: Array.from({ length: 230 }, (_, i) => ({ id: i + 1, text: `Msg${i + 1}` })),
  logs: []
});
const target = new MockHybridDatabaseClient();

// 2. 配置迁移服务（批量迁移+断点续传）
const migrationConfig: DataMigrationConfig = {
  source: source as any,
  target: target as any,
  tables: ['users', 'messages'],
  batchSize: 50,
  resumable: true
};
const migrationService = new DataMigrationService(migrationConfig);

// 3. 进度展示
function renderProgress(progress: MigrationProgress) {
  if (progress.status === 'migrating') {
    console.log(`ADV: ${progress.table} 批次 ${progress.batchIndex + 1}/${Math.ceil(progress.total / (progress.batchSize || 1))}，已迁移 ${progress.migrated}/${progress.total}`);
  } else if (progress.status === 'paused') {
    console.log(`ADV: ${progress.table} 已暂停在批次 ${progress.batchIndex + 1}`);
  } else if (progress.status === 'success') {
    console.log(`ADV: ${progress.table} 完成！`);
  } else if (progress.status === 'error') {
    console.error(`ADV: ${progress.table} 失败:`, progress.error);
  }
}

// 4. 启动迁移并在中途暂停、恢复
(async () => {
  migrationService.migrateAll(renderProgress);
  // 1.5秒后暂停迁移
  setTimeout(() => {
    console.log('===> 调用 pause() 暂停迁移');
    migrationService.pause();
  }, 1500);
  // 3秒后恢复迁移
  setTimeout(() => {
    console.log('===> 调用 resume() 继续迁移');
    migrationService.resume(renderProgress);
  }, 3000);
  // 5秒后输出目标库数据量
  setTimeout(async () => {
    const users = await target.query('users');
    const messages = await target.query('messages');
    console.log('ADV: 迁移后 target.users 数量:', users.length);
    console.log('ADV: 迁移后 target.messages 数量:', messages.length);
  }, 5000);
})();
