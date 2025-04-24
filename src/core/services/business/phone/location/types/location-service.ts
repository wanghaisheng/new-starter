// 定位服务接口与适配器类型定义
import type { Location } from '@/core/lib/db/types/location.types';

export interface ILocationService {
  initialize(): Promise<void>;
  isAvailable(): boolean;
  getCurrentPosition(options?: LocationOptions): Promise<Location>;
  watchPosition(options: LocationOptions, handler: (result: Location) => void): string;
  clearWatch(watchId: string): void;
}

export interface ILocationAdapter extends ILocationService {
  setConfig?(config: Record<string, any>): void;
  dispose?(): void;
}

export type LocationServiceType = 'web' | 'capacitor' | 'mock' | 'huawei' | 'xiaomi' | (string & {});
export interface LocationOptions { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number; [key: string]: any; }

// 导出 LocationServiceOptions 供工厂/注册表透传扩展参数
export interface LocationServiceOptions {
  [key: string]: any;
}
