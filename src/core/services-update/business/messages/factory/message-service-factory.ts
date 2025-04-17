import { IMessageService } from '../types/message-service';
import { MockMessageServiceAdapter } from '../adapters/mock-message-service-adapter';
import { RemoteMessageServiceAdapter } from '../adapters/remote-message-service-adapter';
import { HybridMessageServiceAdapter } from '../adapters/hybrid-message-service-adapter';
import { AdvancedHybridMessageServiceAdapter } from '../adapters/advanced-hybrid-message-service-adapter';

export class MessageServiceFactory {
  static createService(type: string): IMessageService {
    switch (type) {
      case 'mock':
        return new MockMessageServiceAdapter();
      case 'remote':
        return new RemoteMessageServiceAdapter();
      case 'hybrid':
        return new HybridMessageServiceAdapter(
          new MockMessageServiceAdapter(),
          new RemoteMessageServiceAdapter()
        );
      case 'advanced-hybrid':
        return new AdvancedHybridMessageServiceAdapter();
      default:
        throw new Error(`Unknown message service type: ${type}`);
    }
  }
}
