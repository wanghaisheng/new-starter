import type { INFCAdapter, NFCTagResult, NFCTagWriteData } from '../types/nfc-service';

export class MockNFCAdapter implements INFCAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return true; }
  async readTag(): Promise<NFCTagResult> {
    return { id: 'mock-nfc', data: { mock: true } };
  }
  async writeTag(data: NFCTagWriteData): Promise<boolean> {
    return true;
  }
  on(event: string, handler: (payload: any) => void) {}
  off(event: string, handler: (payload: any) => void) {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
