import { ServiceRegistry } from '@/core/services-update/infrastructure/registry';
import { IDataService } from '@/core/services-update/data/types';
import { NetworkService } from '@/core/services-update/infrastructure/providers/network';
import { IMessageService } from '@/core/services-update/business/message/message-service';

export class ServiceFactory {
  private static registry = ServiceRegistry.getInstance();

  public static getService<T>(serviceName: string): T {
    const service = this.registry.getService(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service as T;
  }

  public static registerService(serviceName: string, service: any): void {
    this.registry.registerService(serviceName, service);
  }
} 