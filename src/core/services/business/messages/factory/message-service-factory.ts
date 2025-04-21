import { IMessageService, IMessageAdapter } from '../types/message-service';
import { MessageService } from '../service/message-service';
import { MockMessageServiceAdapter } from '../adapters/mock-message-service-adapter';
import { RemoteMessageServiceAdapter } from '../adapters/remote-message-service-adapter';
import { HybridMessageServiceAdapter } from '../adapters/hybrid-message-service-adapter';
import { AdvancedHybridMessageServiceAdapter } from '../adapters/advanced-hybrid-message-service-adapter';
import { TeenSafetyMessageServiceAdapter } from '../adapters/teen-safety-message-service-adapter';
import { MultiDeviceSyncMessageServiceAdapter } from '../adapters/multi-device-sync-message-service-adapter';
import { AIMessageAssistantAdapter } from '../adapters/ai-message-assistant-adapter';
import type { IDataService } from '@/core/services/data/types';

// 消息服务工厂，统一为 class + static createService 方法
export class MessageServiceFactory {
  static createService(
    type?: 'mock' | 'remote' | 'hybrid' | 'advanced-hybrid',
    dataService?: IDataService,
    options?: { apiBaseUrl?: string; featureFlag?: string; enableTeenSafety?: boolean; enableMultiDevice?: boolean; enableAI?: boolean }
  ): IMessageService {
    let adapter: IMessageAdapter;
    const apiBaseUrl = options?.apiBaseUrl;
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'mock' : 'remote';
    }
    switch (finalType) {
      case 'mock':
        adapter = new MockMessageServiceAdapter(dataService);
        break;
      case 'remote':
        adapter = new RemoteMessageServiceAdapter(dataService, apiBaseUrl);
        break;
      case 'hybrid':
        adapter = new HybridMessageServiceAdapter(
          new MockMessageServiceAdapter(dataService),
          new RemoteMessageServiceAdapter(dataService, apiBaseUrl)
        );
        break;
      case 'advanced-hybrid':
        adapter = new AdvancedHybridMessageServiceAdapter(dataService);
        break;
      default:
        // 自动降级
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          adapter = new MockMessageServiceAdapter(dataService);
        } else {
          adapter = new RemoteMessageServiceAdapter(dataService, apiBaseUrl);
        }
    }
    // 可选聚合 adapter
    if (options?.enableTeenSafety) {
      adapter = new TeenSafetyMessageServiceAdapter(adapter);
    }
    if (options?.enableMultiDevice) {
      adapter = new MultiDeviceSyncMessageServiceAdapter(adapter, options.featureFlag);
    }
    if (options?.enableAI) {
      adapter = new AIMessageAssistantAdapter(adapter);
    }
    return new MessageService(adapter);
  }
}
