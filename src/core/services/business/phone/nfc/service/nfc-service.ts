import type { INFCService, NFCServiceType, NFCServiceOptions, NFCEvent } from '../types/nfc-service';
import { NFCServiceFactory } from '../factory/nfc-service-factory';

/**
 * NFCService：聚合适配器，统一对外暴露 NFC 业务 API
 */
export class NFCService implements INFCService {
  private adapter: INFCService;

  constructor(type: NFCServiceType = 'mock', options: NFCServiceOptions = {}) {
    // 通过工厂自动注入适配器
    this.adapter = NFCServiceFactory.getAdapter(type, options) ?? NFCServiceFactory.getAdapter('mock', {})!;
  }

  initialize(): Promise<void> {
    return this.adapter.initialize();
  }
  isAvailable(): boolean {
    return this.adapter.isAvailable();
  }
  readTag(): Promise<any> {
    return this.adapter.readTag();
  }
  writeTag(data: any): Promise<boolean> {
    return this.adapter.writeTag(data);
  }
  on(event: NFCEvent, handler: (payload: any) => void): void {
    this.adapter.on(event, handler);
  }
  off(event: NFCEvent, handler: (payload: any) => void): void {
    this.adapter.off(event, handler);
  }
}
