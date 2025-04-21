import { INFCAdapter, NFCServiceType } from '../types/nfc-service';
import { MockNFCAdapter } from '../adapters/mock-nfc-adapter';
import { WebNFCAdapter } from '../adapters/web-nfc-adapter';
import { CapacitorNFCAdapter } from '../adapters/capacitor-nfc-adapter';

export class NFCServiceFactory {
  private static adapters: Record<NFCServiceType, () => INFCAdapter> = {};

  static registerAdapter(type: NFCServiceType, factory: () => INFCAdapter) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: NFCServiceType): INFCAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    NFCServiceFactory.registerAdapter('mock', () => new MockNFCAdapter());
    NFCServiceFactory.registerAdapter('web', () => new WebNFCAdapter());
    NFCServiceFactory.registerAdapter('capacitor', () => new CapacitorNFCAdapter());
    // 品牌/扩展适配器可在此扩展
  }
  static create(type: NFCServiceType = 'capacitor'): INFCAdapter {
    NFCServiceFactory.registerAllAdapters();
    const adapter = this.getAdapter(type);
    if (adapter) return adapter;
    // fallback
    return this.getAdapter('mock')!;
  }
}
