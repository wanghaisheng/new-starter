import { ITestService } from '../types/test-service';
import { MockTestServiceAdapter } from '../adapters/mock-test-service-adapter';
import { IServiceFactory, ServiceConfig } from '@/core/services-update/types';

export class TestServiceFactory implements IServiceFactory<ITestService> {
  static createService(type: string, config: ServiceConfig): ITestService {
    switch (type) {
      case 'mock':
      default:
        return new MockTestServiceAdapter();
    }
  }
  getProvider(type: string) {
    if (type === 'mock') return MockTestServiceAdapter;
    return null;
  }
}
