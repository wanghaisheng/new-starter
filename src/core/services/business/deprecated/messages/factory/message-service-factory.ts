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

export type MessageServiceType = 'mock' | 'remote' | 'hybrid' | 'advanced-hybrid';
export type MessageServiceOptions = {
  apiBaseUrl?: string;
  featureFlag?: string;
  enableTeenSafety?: boolean;
  enableMultiDevice?: boolean;
  enableAI?: boolean;
  [key: string]: any;
};

export class MessageServiceFactory {
  static createService({
    type = 'mock',
    dataService,
    options = {}
  }: {
    type?: MessageServiceType,
    dataService?: IDataService,
    options?: MessageServiceOptions
  } = {}): IMessageService {
    // 统一通过 type/options/dataService 创建 MessageService，内部自动注入 adapter
    return new MessageService(type, options, dataService);
  }

  // 新增：自动适配器获取（供统一注册表/工厂调用）
  static getAdapter(type: MessageServiceType = 'mock', options: MessageServiceOptions = {}, dataService?: IDataService): IMessageAdapter {
    const apiBaseUrl = options?.apiBaseUrl;
    let finalType = type;
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'mock' : 'remote';
    }
    let adapter: IMessageAdapter;
    switch (finalType) {
      case 'mock':
        adapter = new MockMessageServiceAdapter(dataService);
        break;
      case 'remote':
        adapter = new RemoteMessageServiceAdapter(dataService, apiBaseUrl);
        break;
      case 'hybrid':
        adapter = new HybridMessageServiceAdapter(dataService, apiBaseUrl);
        break;
      case 'advanced-hybrid':
        adapter = new AdvancedHybridMessageServiceAdapter(dataService, apiBaseUrl);
        break;
      default:
        if (env === 'development' || env === 'test') {
          adapter = new MockMessageServiceAdapter(dataService);
        } else {
          adapter = new RemoteMessageServiceAdapter(dataService, apiBaseUrl);
        }
    }
    if (options?.enableTeenSafety) {
      adapter = new TeenSafetyMessageServiceAdapter(adapter);
    }
    if (options?.enableMultiDevice) {
      adapter = new MultiDeviceSyncMessageServiceAdapter(adapter, options.featureFlag);
    }
    if (options?.enableAI) {
      adapter = new AIMessageAssistantAdapter(adapter);
    }
    return adapter;
  }
}
