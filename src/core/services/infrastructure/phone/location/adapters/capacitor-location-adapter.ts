import type { ILocationAdapter, LocationOptions, LocationResult } from '../types/location-service';

export class CapacitorLocationAdapter implements ILocationAdapter {
  private config: Record<string, any> = {};
  async initialize() {}
  isAvailable() { return typeof window !== 'undefined' && !!window.Capacitor; }
  async getCurrentPosition(options?: LocationOptions): Promise<LocationResult> {
    // 实际实现应调用 Capacitor Geolocation 插件，这里仅返回 mock 数据
    return { latitude: 1, longitude: 1, accuracy: 5, capacitor: true };
  }
  watchPosition(options: LocationOptions, handler: (result: LocationResult) => void): string {
    // 实际实现应调用 Capacitor 插件，这里仅模拟
    const id = 'capacitor-watch';
    setTimeout(() => handler({ latitude: 1, longitude: 1, accuracy: 5, capacitor: true }), 100);
    return id;
  }
  clearWatch(watchId: string): void {}
  setConfig?(config: Record<string, any>) { this.config = config; }
  dispose?() { this.config = {}; }
}
