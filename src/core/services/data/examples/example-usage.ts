// ===============================
// 数据服务主线用法示例（推荐）
// ===============================
import { DataServiceFactory } from '../factory/data-service-factory';
import { DataServiceRegistry } from '../registry/data-service-registry';
import type { DataServiceConfig } from '@/core/services/data/types';
import { SqliteDatabaseClient } from '../adapters/sqlite-database-client';
import { IndexedDBDatabaseClient } from '../adapters/indexeddb-database-client';

async function runExamples() {
  // 1. 使用配置显式创建 Sqlite 数据服务
  const sqliteConfig: DataServiceConfig = {
    environment: 'development',
    services: {
      data: {
        adapter: 'sqlite',
        options: {
          sqlite: { name: 'mydb.sqlite', location: 'default' }
        }
      }
    }
  };
  const sqliteService = DataServiceFactory.createService(sqliteConfig);
  await sqliteService.initialize();
  await sqliteService.insert('users', { id: 'u1', name: 'Alice' });

  // 2. 使用配置显式创建 IndexedDB 数据服务
  const indexeddbConfig: DataServiceConfig = {
    environment: 'development',
    services: {
      data: {
        adapter: 'indexeddb',
        options: {
          indexeddb: { name: 'mydb', version: 1 }
        }
      }
    }
  };
  const indexeddbService = DataServiceFactory.createService(indexeddbConfig);
  await indexeddbService.initialize();
  await indexeddbService.insert('users', { id: 'u2', name: 'Bob' });

  // 3. 自动根据环境变量选择适配器
  const envService = DataServiceFactory.createService();
  await envService.initialize();
  const users = await envService.query('users');

  // 4. 多实例注册与获取
  DataServiceRegistry.register('sqlite', sqliteService);
  DataServiceRegistry.register('indexeddb', indexeddbService);
  const mainService = DataServiceRegistry.get('sqlite');
  if (!mainService) throw new Error('Main service not found');

  // 5. 业务层统一用法
  const user = await mainService.findOne('users', 'u1');
  await mainService.update('users', 'u1', { name: 'Alice Updated' });
  await mainService.delete('users', 'u1');

  // 6. 离线/Mock/扩展适配器用法（如有实现）
  // const mockService = DataServiceFactory.createService({ ... });
  // await mockService.initialize();
  // ...
}

// ===============================
// 事件与缓存机制用法示例
// ===============================
async function demoEventAndCache() {
  const service = DataServiceFactory.createService();
  await service.initialize();

  // 事件监听
  service.on('insert', (entity) => {
    console.log('[event] 新数据插入：', entity);
  });
  service.on('update', (id, data) => {
    console.log('[event] 数据更新：', id, data);
  });
  service.on('delete', (id) => {
    console.log('[event] 数据删除：', id);
  });

  // 查询缓存演示
  await service.insert('users', { id: 'u3', name: 'Eve' });
  const cachedUser = await service.findOne('users', 'u3');
  console.log('[cache] 查询缓存命中：', cachedUser);
  await service.clear();
}

// ===============================
// 销毁与懒加载用法示例
// ===============================
async function demoDispose() {
  const service = DataServiceFactory.createService();
  await service.initialize();
  // ...业务操作
  await service.dispose();
  console.log('[dispose] 服务已销毁');
}

// ===============================
// 主入口
// ===============================
async function main() {
  await runExamples();
  await demoEventAndCache();
  await demoDispose();
}

main().catch(console.error);