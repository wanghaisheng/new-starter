import type { ISensorService, SensorServiceType } from '../types/sensor-service';
import { MockSensorAdapter } from '../adapters/mock-sensor-adapter';
import { WebSensorAdapter } from '../adapters/web-sensor-adapter';
import { CapacitorSensorAdapter } from '../adapters/capacitor-sensor-adapter';
import { Capacitor } from '@capacitor/core';

export class SensorServiceFactory {
  private static adapters: Record<string, () => ISensorService> = {};

  static registerAdapter(type: SensorServiceType, factory: () => ISensorService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: SensorServiceType): ISensorService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }
  static registerAllAdapters() {
    SensorServiceFactory.registerAdapter('mock', () => new MockSensorAdapter());
    SensorServiceFactory.registerAdapter('web', () => new WebSensorAdapter());
    SensorServiceFactory.registerAdapter('capacitor', () => new CapacitorSensorAdapter());
  }
  static create(type: SensorServiceType = 'capacitor'): ISensorService {
    SensorServiceFactory.registerAllAdapters();
    const adapter = this.getAdapter(type);
    if (adapter) return adapter;
    // auto
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Sensors')) {
      return this.getAdapter('capacitor')!;
    } else if ('Accelerometer' in window || 'Gyroscope' in window) {
      const webAdapter = this.getAdapter('web');
      if (webAdapter) return webAdapter;
      return this.getAdapter('mock')!;
    }
    return this.getAdapter('mock')!;
  }
}
