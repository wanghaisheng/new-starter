import type { INFCAdapter, NFCServiceType, NFCServiceOptions } from '../types/nfc-service';
import { MockNFCAdapter } from '../adapters/mock-nfc-adapter';
import { WebNFCAdapter } from '../adapters/web-nfc-adapter';
import { CapacitorNFCAdapter } from '../adapters/capacitor-nfc-adapter';
import { NFCService } from '../service/nfc-service';

export class NFCServiceFactory {
  private static adapters: Record<NFCServiceType, (options?: NFCServiceOptions) => INFCAdapter> = {
    mock: () => new MockNFCAdapter(),
    web: () => new WebNFCAdapter(),
    capacitor: () => new CapacitorNFCAdapter(),
    huawei: () => new MockNFCAdapter(), // 可扩展为 HuaweiNFCAdapter
    xiaomi: () => new MockNFCAdapter(), // 可扩展为 XiaomiNFCAdapter
  };

  static registerAdapter(type: NFCServiceType, factory: (options?: NFCServiceOptions) => INFCAdapter) {
    this.adapters[type] = factory;
  }

  static getAdapter(type: NFCServiceType = 'mock', options: NFCServiceOptions = {}): INFCAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  static registerAllAdapters() {
    NFCServiceFactory.registerAdapter('mock', () => new MockNFCAdapter());
    NFCServiceFactory.registerAdapter('web', () => new WebNFCAdapter());
    NFCServiceFactory.registerAdapter('capacitor', () => new CapacitorNFCAdapter());
    NFCServiceFactory.registerAdapter('huawei', () => new MockNFCAdapter());
    NFCServiceFactory.registerAdapter('xiaomi', () => new MockNFCAdapter());
  }

  static createService({
    type = 'capacitor',
    options = {}
  }: {
    type?: NFCServiceType,
    options?: NFCServiceOptions
  } = {}): NFCService {
    this.registerAllAdapters();
    return new NFCService(type, options);
  }
}
