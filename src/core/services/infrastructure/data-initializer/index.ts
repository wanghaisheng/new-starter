// 数据初始化聚合导出
import { DataInitializerService } from '@/core/services/infrastructure/data-initializer/data-initializer-service';
import { DataInitializerRegistry } from '@/core/services/infrastructure/data-initializer/registry/data-initializer-registry';
import { DbInitMode } from '@/core/lib/db/types/common';
import { getConfigService } from '@/core/services/infrastructure/config';
import { parseEnum } from '@/core/services/infrastructure/config/parse-enum';
import type { IDataInitializerAdapter } from '@/core/services/infrastructure/data-initializer/types/data-initializer-adapter';

// 导出类型和服务
export { DataInitializerService };
export { DataInitializerRegistry };
export * from '@/core/services/infrastructure/data-initializer/types/data-initializer-adapter';

// 全局单例实例
let dataInitializerService: DataInitializerService | undefined;
let dataInitializerAdapter: IDataInitializerAdapter | undefined;

/**
 * 异步初始化数据初始化服务
 * 用法：await initDataInitializer();
 */
export async function initDataInitializer(mode?: DbInitMode | string) {
  // 如果配置服务已初始化，从配置服务获取初始化模式
  let resolvedMode = mode;
  
  try {
    const configService = getConfigService();
    // 优先使用传入的模式，其次从配置中获取
    if (!resolvedMode) {
      // 按优先级尝试获取初始化模式
      resolvedMode = configService.get?.('NEXT_PUBLIC_DB_INIT_MODE') ||
                     configService.get?.('DB_INIT_MODE');
      
      // 如果从配置中获取到了字符串模式，尝试解析为枚举
      if (typeof resolvedMode === 'string') {
        resolvedMode = parseEnum(DbInitMode, resolvedMode, DbInitMode.SCHEMA, 'initDataInitializer');
      }
    }
  } catch (e) {
    console.warn('[DataInitializer] 配置服务未初始化，使用默认初始化模式');
  }

  // 创建数据初始化服务实例
  dataInitializerService = new DataInitializerService({
    mode: resolvedMode || DbInitMode.SCHEMA,
  });
  
  // 初始化适配器
  const client = await dataInitializerService.initialize();
  dataInitializerAdapter = dataInitializerService.getAdapter();
  
  return { dataInitializerService, dataInitializerAdapter, client };
}

/**
 * 获取已初始化的数据初始化服务
 * 若未初始化会抛出异常
 */
export function getDataInitializerService() {
  if (!dataInitializerService) {
    console.error('[DEBUG] getDataInitializerService called before initDataInitializer');
    console.error(new Error('[DEBUG] getDataInitializerService stack trace').stack);
    throw new Error('DataInitializerService not initialized, call initDataInitializer() first.');
  }
  return dataInitializerService;
}

/**
 * 获取已初始化的数据初始化适配器
 * 若未初始化会抛出异常
 */
export function getDataInitializerAdapter() {
  if (!dataInitializerAdapter) throw new Error('DataInitializerAdapter not initialized, call initDataInitializer() first.');
  return dataInitializerAdapter;
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetDataInitializer() {
  dataInitializerService = undefined;
  dataInitializerAdapter = undefined;
}
