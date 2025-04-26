import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { DataInitializerRegistry } from './registry/data-initializer-registry';
import { IDataInitializerAdapter } from './types/data-initializer-adapter';

interface DataInitializerServiceOptions {
  dbKey?: string;
  importType?: string;
  jsonFilePath?: string;
  sqlDir?: string;
  [key: string]: any;
}

export class DataInitializerService {
  private adapter: IDataInitializerAdapter;

  constructor(options: DataInitializerServiceOptions = {}) {
    // 1. 获取配置服务实例
    const configService = ConfigService.getInstance();
    const dbKey = options.dbKey || configService.get('DB_KEY') || 'default';
    const importType = options.importType || configService.get('MOCK_DB_IMPORT_MODE') || 'json';
    const jsonFilePath = options.jsonFilePath || configService.get('MOCK_JSON_FILE') || './mock-data.json';
    const sqlDir = options.sqlDir || configService.get('MOCK_SQL_DIR') || './mock-sql';
    // 2. 获取目标数据库 client
    const dbClient = options.dbClient || DataServiceRegistry.get(dbKey);
    if (!dbClient) throw new Error(`[DataInitializerService] 未找到数据服务实例: ${dbKey}`);
    // 3. 构建适配器参数
    const adapterParams = {
      dbClient,
      jsonFilePath,
      sqlDir,
      ...options
    };
    // 4. 获取适配器
    this.adapter = DataInitializerRegistry.getAdapter(importType, adapterParams);
    if (!this.adapter) throw new Error(`[DataInitializerService] 未找到数据初始化适配器: ${importType}`);
  }

  async initialize() {
    await this.adapter.initialize();
  }

  getClient() {
    return this.adapter.getClient();
  }
}
