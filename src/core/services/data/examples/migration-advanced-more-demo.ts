import { MockHybridDatabaseClient } from './mock-hybrid-database-client';
import { DataMigrationService, DataMigrationConfig, MigrationProgress, MigrationLog } from '../migration/data-migration-service';

// 1. 构造 mock 数据
const source = new MockHybridDatabaseClient({
  users: Array.from({ length: 120 }, (_, i) => ({ id: i + 1, name: `User${i + 1}` })),
  messages: Array.from({ length: 230 }, (_, i) => ({ id: i + 1, text: `Msg${i + 1}` })),
  logs: []
});
const target = new MockHybridDatabaseClient();

// 2. 配置迁移服务（批量迁移+断点续传+重试+校验+日志）
const migrationConfig: DataMigrationConfig = {
  source: source as any,
  target: target as any,
  tables: ['users', 'messages'],
  batchSize: 50,
  resumable: true,
  maxRetry: 2,
  verify: true,
  onLog: (log: MigrationLog) => {
    // 日志回调，可持久化到文件/数据库
    if (log.status === 'error') {
      console.error('[LOG]', log);
    } else {
      // 可选：console.log('[LOG]', log);
    }
  }
};
const migrationService = new DataMigrationService(migrationConfig);

// 3. 进度展示
function renderProgress(progress: MigrationProgress) {
  if (progress.status === 'migrating') {
    console.log(`MORE: ${progress.table} 批次 ${(progress.batchIndex ?? 0) + 1}/${Math.ceil(progress.total / (progress.batchSize || 1))}，已迁移 ${progress.migrated}/${progress.total}`);
  } else if (progress.status === 'paused') {
    console.log(`MORE: ${progress.table} 已暂停在批次 ${(progress.batchIndex ?? 0) + 1}`);
  } else if (progress.status === 'retrying') {
    console.warn(`MORE: ${progress.table} 正在重试（第${progress.retryCount}次）...`);
  } else if (progress.status === 'verifying') {
    console.log(`MORE: ${progress.table} 正在校验...`);
  } else if (progress.status === 'success') {
    console.log(`MORE: ${progress.table} 完成！校验结果: ${progress.verifyPassed ? '通过' : '失败'}`);
  } else if (progress.status === 'error') {
    console.error(`MORE: ${progress.table} 失败:`, progress.error);
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
  // 5秒后输出目标库数据量和全部迁移日志
  setTimeout(async () => {
    const users = await target.query('users');
    const messages = await target.query('messages');
    console.log('MORE: 迁移后 target.users 数量:', users.length);
    console.log('MORE: 迁移后 target.messages 数量:', messages.length);
    console.log('MORE: 全部迁移日志:', migrationService.getLogs());
  }, 5000);
})();
