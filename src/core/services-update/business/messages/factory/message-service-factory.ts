import { IMessageService } from '../types/message-service';
import { MockMessageServiceAdapter } from '../adapters/mock-message-service-adapter';
import { IServiceFactory, ServiceConfig } from '@/core/services-update/types';
import { IDataService } from '@/core/services-update/data/types';

export class MessageServiceFactory implements IServiceFactory<IMessageService> {
  static createService(type: string, dataService: IDataService, config: ServiceConfig): IMessageService {
    switch (type) {
      case 'mock':
      default:
        return new MockMessageServiceAdapter(dataService);
    }
  }
  getProvider(type: string) {
    if (type === 'mock') return MockMessageServiceAdapter;
    return null;
  }
}
