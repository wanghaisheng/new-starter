import { IMatchService } from '../types/match-service';
import { MockMatchServiceAdapter } from '../adapters/mock-match-service-adapter';
import { IServiceFactory, ServiceConfig } from '@/core/services-update/types';
import { IDataService } from '@/core/services-update/data/types';

export class MatchServiceFactory implements IServiceFactory<IMatchService> {
  static createService(type: string, dataService: IDataService, config: ServiceConfig): IMatchService {
    switch (type) {
      case 'mock':
      default:
        return new MockMatchServiceAdapter(dataService);
    }
  }
  getProvider(type: string) {
    if (type === 'mock') return MockMatchServiceAdapter;
    return null;
  }
}
