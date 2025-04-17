import { IMatchService } from '../types/match-service';
import { IDataService } from '@/core/services-update/data/types';
import { MatchServiceRegistry } from '../registry/match-registry';

/**
 * MatchServiceFactory
 * 负责根据类型和数据服务实例创建 IMatchService 实现
 * 推荐用法：type 由上层（如 AppService）统一配置和注入
 */
export class MatchServiceFactory {
  static createService(type: string, dataService: IDataService): IMatchService {
    // 通过注册表查找 provider，支持扩展和动态切换
    const provider = MatchServiceRegistry.getInstance().getProvider(type);
    if (!provider) {
      throw new Error(`No match service provider registered for type: ${type}`);
    }
    return provider(dataService);
  }
}
