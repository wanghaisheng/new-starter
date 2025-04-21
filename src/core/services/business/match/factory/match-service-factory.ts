// 匹配服务工厂，统一为 class + static createService 方法
import { IMatchService } from '../types/match-service';
import { IDataService } from '@/core/services/data/types';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';
import { RemoteMatchServiceAdapter } from '../adapters/remote-match-service-adapter';
import { HybridMatchServiceAdapter } from '../adapters/hybrid-match-service-adapter';
import { BrandAMatchServiceAdapter } from '../adapters/brandA-match-service-adapter';
import { BrandBMatchServiceAdapter } from '../adapters/brandB-match-service-adapter';

/**
 * MatchServiceFactory
 * 负责根据类型和数据服务实例创建 IMatchService 实现
 * 推荐用法：type 由上层（如 AppService）统一配置和注入
 * 支持自动降级：测试/开发环境自动使用 mock，生产环境用 remote/hybrid
 */
export class MatchServiceFactory {
  /**
   * 创建匹配服务实例
   * @param dataService 必填，注入自定义数据服务实例
   * @param type 匹配服务类型 mock/remote/hybrid/brandA/brandB，默认自动根据 NODE_ENV 推断
   * @returns 匹配服务实例
   */
  static createService(
    dataService: IDataService,
    type?: 'mock' | 'remote' | 'hybrid' | 'brandA' | 'brandB'
  ): IMatchService {
    if (!dataService) {
      throw new Error('[MatchServiceFactory] dataService is required');
    }
    // 自动降级：测试/开发环境优先 mock
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      if (env === 'test' || env === 'development') finalType = 'mock';
      else finalType = 'remote';
    }
    switch (finalType) {
      case 'mock':
        return new MockMatchServiceAdapter(dataService);
      case 'remote':
        return new RemoteMatchServiceAdapter(dataService);
      case 'hybrid':
        return new HybridMatchServiceAdapter(dataService);
      case 'brandA':
        return new BrandAMatchServiceAdapter(dataService);
      case 'brandB':
        return new BrandBMatchServiceAdapter(dataService);
      default:
        throw new Error(`[MatchServiceFactory] Invalid match service type: ${finalType}`);
    }
  }
}
