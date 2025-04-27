// 匹配服务工厂，统一为 class + static createService 方法
import { IMatchService } from '../types/match-service';
import { IDataService } from '@/core/services/data/types';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';
import { RemoteMatchServiceAdapter } from '../adapters/remote-match-service-adapter';
import { HybridMatchServiceAdapter } from '../adapters/hybrid-match-service-adapter';
import { BrandAMatchServiceAdapter } from '../adapters/brandA-match-service-adapter';
import { BrandBMatchServiceAdapter } from '../adapters/brandB-match-service-adapter';
import { MatchService } from '../service/match-service'; // 新增导入 MatchService

/**
 * MatchServiceFactory
 * 负责根据类型和数据服务实例创建 IMatchService 实现
 * 推荐用法：type 由上层（如 AppService）统一配置和注入
 * 支持自动降级：测试/开发环境自动使用 mock，生产环境用 remote/hybrid
 */
export type MatchServiceType = 'mock' | 'remote' | 'hybrid' | 'brandA' | 'brandB';
export type MatchServiceOptions = { [key: string]: any };

export class MatchServiceFactory {
  /**
   * 创建匹配服务实例
   * @param params 必填，包含 type、dataService 和 options
   * @returns 匹配服务实例
   */
  static createService({
    type = 'remote',
    dataService,
    options = {}
  }: {
    type?: MatchServiceType,
    dataService: IDataService,
    options?: MatchServiceOptions
  }): IMatchService {
    if (!dataService) {
      throw new Error('[MatchServiceFactory] dataService is required');
    }
    // 统一通过 type/options/dataService 创建 MatchService，内部自动注入 adapter
    return new MatchService(type, options,dataService);
  }

  // 自动适配器获取（供统一注册表/工厂调用）
  static getAdapter(type: MatchServiceType = 'remote', options: MatchServiceOptions = {}, dataService: IDataService): any {
    if (!dataService) {
      throw new Error('[MatchServiceFactory.getAdapter] dataService is required');
    }
    switch (type) {
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
        throw new Error(`[MatchServiceFactory.getAdapter] Invalid match service type: ${type}`);
    }
  }
}
