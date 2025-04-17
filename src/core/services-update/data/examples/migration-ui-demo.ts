import { MockHybridDatabaseClient } from './mock-hybrid-database-client';
import { DataMigrationService, DataMigrationConfig, MigrationProgress } from '../migration/data-migration-service';

// 1. 构造 mock 数据
const source = new MockHybridDatabaseClient({
  users: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `User${i + 1}` })),
  messages: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, text: `Msg${i + 1}` })),
  logs: []
});
const target = new MockHybridDatabaseClient();

// 2. 配置迁移服务
const migrationConfig: DataMigrationConfig = {
  source: source as any,
  target: target as any,
  tables: ['users', 'messages', 'logs']
};
const migrationService = new DataMigrationService(migrationConfig);

// 3. 模拟 UI 层进度实时展示
function renderProgress(progress: MigrationProgress) {
  const bar = progress.total > 0 ? `[${'='.repeat(progress.migrated)}${'-'.repeat(progress.total - progress.migrated)}]` : '';
  if (progress.status === 'migrating') {
    console.log(`UI: ${progress.table} ${bar} ${progress.migrated}/${progress.total}`);
  } else if (progress.status === 'success') {
    console.log(`UI: ${progress.table} 完成！`);
  } else if (progress.status === 'error') {
    console.error(`UI: ${progress.table} 失败:`, progress.error);
  }
}

// 4. 启动迁移并实时展示
migrationService.migrateAll(renderProgress);

// 5. 查询迁移后目标库数据
setTimeout(async () => {
  const users = await target.query('users');
  const messages = await target.query('messages');
  console.log('UI: 迁移后 target.users:', users);
  console.log('UI: 迁移后 target.messages:', messages);
}, 3000);
