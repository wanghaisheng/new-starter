// NFC服务接口与适配器类型定义
export interface INFCService {
  initialize(): Promise<void>;
  isAvailable(): boolean;
  readTag(): Promise<NFCTagResult>;
  writeTag(data: NFCTagWriteData): Promise<boolean>;
  on(event: NFCEvent, handler: (payload: any) => void): void;
  off(event: NFCEvent, handler: (payload: any) => void): void;
}

export interface INFCAdapter extends INFCService {
  setConfig?(config: Record<string, any>): void;
  dispose?(): void;
}

export type NFCServiceType = 'web' | 'capacitor' | 'mock' | 'huawei' | 'xiaomi' | (string & {});
export type NFCEvent = 'tagRead' | 'tagWritten' | 'error';
export interface NFCTagResult { id: string; data: any; [key: string]: any; }
export interface NFCTagWriteData { data: any; [key: string]: any; }
