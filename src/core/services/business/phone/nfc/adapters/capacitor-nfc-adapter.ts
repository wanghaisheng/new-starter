import type { INFCAdapter, NFCTagResult, NFCTagWriteData } from '../types/nfc-service';

export class CapacitorNFCAdapter implements INFCAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return typeof window !== 'undefined' && !!window.Capacitor; }
  async readTag(): Promise<NFCTagResult> {
    // 实际实现应调用 Capacitor NFC 插件，这里仅返回 mock 数据
    return { id: 'capacitor-nfc', data: { capacitor: true } };
  }
  async writeTag(data: NFCTagWriteData): Promise<boolean> {
    // 实际实现应调用 Capacitor NFC 插件，这里仅返回 mock 数据
    return true;
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
