import { IMatchService } from '../types/match-service';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';
import { RemoteMatchServiceAdapter } from '../adapters/remote-match-service-adapter';
import { HybridMatchServiceAdapter } from '../adapters/hybrid-match-service-adapter';
import { BrandAMatchServiceAdapter } from '../adapters/brandA-match-service-adapter';
import { BrandBMatchServiceAdapter } from '../adapters/brandB-match-service-adapter';
import { IDataService } from '@/core/services-update/data/types';

/**
 * MatchServiceRegistry
 * 支持运行时动态注册/查找不同类型的匹配服务实现
 */
export class MatchServiceRegistry {
  private static instance: MatchServiceRegistry;
  private providers: Map<string, (dataService: IDataService) => IMatchService> = new Map();

  private constructor() {
    this.registerProvider('mock', (ds) => new MockMatchServiceAdapter(ds));
    this.registerProvider('remote', (ds) => new RemoteMatchServiceAdapter(ds));
    this.registerProvider('hybrid', (ds) => new HybridMatchServiceAdapter(ds));
    this.registerProvider('brandA', (ds) => new BrandAMatchServiceAdapter(ds));
    this.registerProvider('brandB', (ds) => new BrandBMatchServiceAdapter(ds));
  }

  public static getInstance(): MatchServiceRegistry {
    if (!MatchServiceRegistry.instance) {
      MatchServiceRegistry.instance = new MatchServiceRegistry();
    }
    return MatchServiceRegistry.instance;
  }

  public getProvider(type: string): ((dataService: IDataService) => IMatchService) | undefined {
    return this.providers.get(type);
  }

  public registerProvider(type: string, factory: (dataService: IDataService) => IMatchService): void {
    this.providers.set(type, factory);
  }

  public unregisterProvider(type: string): void {
    this.providers.delete(type);
  }
}
