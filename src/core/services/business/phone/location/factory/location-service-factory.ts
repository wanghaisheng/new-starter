import { ILocationAdapter, LocationServiceType } from '../types/location-service';
import { MockLocationAdapter } from '../adapters/mock-location-adapter';
import { WebLocationAdapter } from '../adapters/web-location-adapter';
import { CapacitorLocationAdapter } from '../adapters/capacitor-location-adapter';

export class LocationServiceFactory {
  private static adapters: Record<LocationServiceType, () => ILocationAdapter> = {};

  static registerAdapter(type: LocationServiceType, factory: () => ILocationAdapter) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: LocationServiceType): ILocationAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    LocationServiceFactory.registerAdapter('mock', () => new MockLocationAdapter());
    LocationServiceFactory.registerAdapter('web', () => new WebLocationAdapter());
    LocationServiceFactory.registerAdapter('capacitor', () => new CapacitorLocationAdapter());
    // 品牌/扩展适配器可在此扩展
  }
  static create(type: LocationServiceType = 'capacitor'): ILocationAdapter {
    LocationServiceFactory.registerAllAdapters();
    const adapter = this.getAdapter(type);
    if (adapter) return adapter;
    // fallback
    return this.getAdapter('mock')!;
  }
}
