import { BaseRepository } from './base-repository';
import { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { onboardSchema } from '@/core/lib/db/schema/definitions/onboard-schema';
import { OnboardConfig } from '../../types/onboard.types';

const onboardConverter = new EntityConverter<OnboardConfig>(onboardSchema);

/**
 * OnboardConfigRepository - 新手引导配置仓储实现
 * 负责从数据库读取和存储 OnboardConfig 类型数据
 */
class OnboardConfigRepository extends BaseRepository<OnboardConfig, OnboardConfig> {
  constructor(dataService: IDataService<OnboardConfig>) {
    super(dataService as any, 'onboards', onboardConverter);
  }

  /** 获取新手引导配置 */
  async getOnboardConfig(options?: Record<string, any>): Promise<OnboardConfig | null> {
    // 可根据 options 查询不同配置
    const results = await this.client.query(this.table, { where: options || {} });
    if (results && results.items && results.items.length > 0) {
      return this.converter.fromDatabase(results.items[0]);
    }
    return null;
  }

  /** 保存新手引导配置 */
  async saveOnboardConfig(config: OnboardConfig): Promise<OnboardConfig> {
    const dbRecord = this.converter.toDatabase(config);
    const saved = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(saved);
  }
}

RepositoryFactoryRegistry.registerFactory('onboard', (options: { dataService: IDataService<OnboardConfig> }) => new OnboardConfigRepository(options.dataService));

export { OnboardConfigRepository };