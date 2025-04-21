// 定位服务接口与适配器类型定义
export interface ILocationService {
  initialize(): Promise<void>;
  isAvailable(): boolean;
  getCurrentPosition(options?: LocationOptions): Promise<LocationResult>;
  watchPosition(options: LocationOptions, handler: (result: LocationResult) => void): string;
  clearWatch(watchId: string): void;
}

export interface ILocationAdapter extends ILocationService {
  setConfig?(config: Record<string, any>): void;
  dispose?(): void;
}

export type LocationServiceType = 'web' | 'capacitor' | 'mock' | 'huawei' | 'xiaomi' | (string & {});
export interface LocationOptions { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number; }
export interface LocationResult { latitude: number; longitude: number; accuracy?: number; altitude?: number; [key: string]: any; }
