// 手机端定位服务接口与 PWA/Web 实现
export interface ILocationService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  requestPermissions(): Promise<boolean>;
  isAvailable(): boolean;
  getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined>;
}

export class LocationService implements ILocationService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }

  async requestPermissions(): Promise<boolean> {
    if (!navigator.geolocation) {
      alert('当前环境不支持定位');
      return false;
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  isAvailable(): boolean {
    return !!navigator.geolocation;
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined> {
    if (!navigator.geolocation) return undefined;
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(undefined)
      );
    });
  }
}

// 针对不同品牌/机型的定位服务实现（示例：iPhone、Samsung）
export class IPhoneLocationService extends LocationService {
  async requestPermissions(): Promise<boolean> {
    // iOS 需处理隐私弹窗、兼容 Safari 特性
    return super.requestPermissions();
  }
}

export class SamsungLocationService extends LocationService {
  async requestPermissions(): Promise<boolean> {
    // 三星机型可扩展特殊兼容
    return super.requestPermissions();
  }
}

export class MockLocationService implements ILocationService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  async requestPermissions(): Promise<boolean> { return true; }
  isAvailable(): boolean { return true; }
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined> { return { lat: 0, lng: 0 }; }
}
