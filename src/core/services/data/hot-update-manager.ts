// 热更新管理器：自动桥接 ConfigService 与 DataServiceRegistry
import { configService } from '@/core/services/infrastructure/config';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { DataServiceFactory } from '@/core/services/data/factory/data-service-factory';

// 需要监听的关键配置项
const keysToWatch = [
  'NEXT_PUBLIC_SQLITE_DB_NAME',
  'NEXT_PUBLIC_INDEXEDDB_NAME',
  'NEXT_PUBLIC_CACHE_PROVIDER',
  // ...可扩展其它关键项
];

// 主服务 key（可根据实际业务调整）
const SERVICE_KEY = 'main-db';

function buildConfigFromService(configService: typeof import('@/core/services/infrastructure/config').configService) {
  // TODO: 根据实际业务拼装 DataServiceConfig
  return {
    mode: 'hybrid',
    services: {
      data: {
        onlineProvider: configService.get('NEXT_PUBLIC_SQLITE_DB_NAME'),
        offlineProvider: configService.get('NEXT_PUBLIC_INDEXEDDB_NAME'),
        cacheProvider: configService.get('NEXT_PUBLIC_CACHE_PROVIDER'),
        // ...其它配置项
      }
    }
  } as any; // 请替换为实际 DataServiceConfig 类型
}

// 自动监听关键配置项
keysToWatch.forEach(key => {
  configService.subscribe(key, () => {
    const oldInstance = DataServiceRegistry.get(SERVICE_KEY);
    if (oldInstance?.dispose) oldInstance.dispose();
    DataServiceRegistry.unregister(SERVICE_KEY);
    const newConfig = buildConfigFromService(configService);
    DataServiceRegistry.register(SERVICE_KEY, () => DataServiceFactory.createService(newConfig));
  });
});
