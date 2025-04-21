import type { INFCAdapter, NFCTagResult, NFCTagWriteData } from '../types/nfc-service';

export class WebNFCAdapter implements INFCAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return 'NDEFReader' in window; }
  async readTag(): Promise<NFCTagResult> {
    // 实际实现应调用 Web NFC API，这里仅返回 mock 数据
    return { id: 'web-nfc', data: { web: true } };
  }
  async writeTag(data: NFCTagWriteData): Promise<boolean> {
    // 实际实现应调用 Web NFC API，这里仅返回 mock 数据
    return true;
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
