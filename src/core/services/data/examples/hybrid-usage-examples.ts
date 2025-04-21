import { HybridDatabaseClient } from '../adapters/hybrid-database-client';

// ===============================
// 离线优先（Offline-First）用法示例
// ===============================
async function offlineFirstExample() {
  const hybrid = new HybridDatabaseClient({ /* 可指定 hybrid/offline/online 配置 */ });
  hybrid.setMode('offline'); // 明确指定离线优先

  // 事件监听
  hybrid.on('insert', (entity) => {
    console.log('[offlineFirst][event] 新数据插入：', entity);
  });

  // 写入数据（本地 IndexedDB/CapacitorSqlite）
  await hybrid.insert('messages', { id: 'msg1', content: 'hi', createdAt: Date.now() });
  // 读取数据（本地）
  const msg = await hybrid.findOne('messages', 'msg1');
  console.log('[offlineFirst] 本地消息：', msg);

  // 后台同步到云端（如有需求）
  await hybrid.sync?.();
  console.log('[offlineFirst] 已触发同步');

  // 销毁服务
  await hybrid.dispose();
  console.log('[offlineFirst] 服务已销毁');
}

// ===============================
// 在线优先（Online-First）用法示例
// ===============================
async function onlineFirstExample() {
  const hybrid = new HybridDatabaseClient({ /* ... */ });
  hybrid.setMode('online'); // 明确指定在线优先

  // 事件监听
  hybrid.on('update', (id, data) => {
    console.log('[onlineFirst][event] 数据更新：', id, data);
  });

  // 写入数据（优先云端 Sqlite/Supabase/Firebase）
  await hybrid.insert('users', { id: 'u1', name: 'Alice' });
  // 读取数据（优先云端）
  const user = await hybrid.findOne('users', 'u1');
  console.log('[onlineFirst] 云端用户：', user);

  // 若网络不可用可降级到本地，业务层可监听网络状态后切换模式
  // ...

  await hybrid.dispose();
  console.log('[onlineFirst] 服务已销毁');
}

// ===============================
// 手动同步（Manual Sync）用法示例
// ===============================
async function manualSyncExample() {
  const hybrid = new HybridDatabaseClient({ /* ... */ });
  hybrid.setMode('offline'); // 先在本地操作

  // 事件监听
  hybrid.on('sync', (status) => {
    console.log('[manualSync][event] 同步状态：', status);
  });

  // 批量写入本地草稿
  await hybrid.insert('drafts', { id: 'd1', content: 'draft1', createdAt: Date.now() });
  console.log('[manualSync] 草稿已保存本地');

  // 用户主动触发同步（如点击“同步”按钮）
  await hybrid.sync?.();
  console.log('[manualSync] 用户主动同步完成');

  await hybrid.dispose();
  console.log('[manualSync] 服务已销毁');
}

// ===============================
// 主入口（可根据实际业务场景调用相应方法）
// ===============================
async function main() {
  await offlineFirstExample();
  await onlineFirstExample();
  await manualSyncExample();
}

// main(); // 如需自动运行全部示例请取消注释

export {};
