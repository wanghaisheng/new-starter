import { DbInitMode } from '@/core/lib/db/types/common';
import { DataInitializerFactory } from '@/core/services/infrastructure/data-initializer/factory/data-initializer-factory';
import { getConfigService } from '@/core/services/infrastructure/config';
import { ConfigSchema } from '@/core/services/infrastructure/config/config-types';

export interface DataInitializerOptions {
  mode?: DbInitMode | string;
  config?: any;
}

/**
 * 数据库初始化主服务
 * - 读取配置/环境变量
 * - 自动选择模式与适配器
 * - 执行结构与数据初始化
 * - 幂等、可重入
 */
export class DataInitializerService {
  private options: DataInitializerOptions;
  private config: ConfigSchema;
  constructor(options: DataInitializerOptions = {}) {
    // 推荐通过 getConfigService 获取单例配置服务
    const configService = getConfigService();
    this.config = (configService as any).get?.('all') || {};
    this.options = {
      mode: options.mode || this.config.NEXT_PUBLIC_DB_INIT_MODE || DbInitMode.SCHEMA,
      config: options.config || {},
    };
  }

  /**
   * 主初始化入口
   * - 自动选择适配器
   * - 执行结构和/或默认数据导入
   * @param options
   *   mode: 'structure' | 'full'
   *   tables?: string[]
   *   reset?: boolean
   */
  async initialize(options?: { mode?: 'structure' | 'full'; tables?: string[]; reset?: boolean }) {
    const mode = this.options.mode || DbInitMode.SCHEMA;
    const adapter = DataInitializerFactory.createAdapter(mode, this.options.config);
    await adapter.initialize(options);
    return adapter.getClient();
  }
}
