import type { ISensorService, SensorProviderType, SensorServiceOptions } from '../types/sensor-service';
import { MockSensorAdapter } from '../adapters/mock-sensor-adapter';
import { WebSensorAdapter } from '../adapters/web-sensor-adapter';
import { CapacitorSensorAdapter } from '../adapters/capacitor-sensor-adapter';

export class SensorServiceFactory {
  private static adapters: Record<SensorProviderType, (options?: SensorServiceOptions) => ISensorService> = {
    mock: (options) => new MockSensorAdapter(options),
    web: (options) => new WebSensorAdapter(options),
    capacitor: (options) => new CapacitorSensorAdapter(options),
  };

  static registerAdapter(type: SensorProviderType, factory: (options?: SensorServiceOptions) => ISensorService) {
    this.adapters[type] = factory;
  }

  static getAdapter(type: SensorProviderType = 'mock', options: SensorServiceOptions = {}): ISensorService | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  static registerAllAdapters() {
    SensorServiceFactory.registerAdapter('mock', (options) => new MockSensorAdapter(options));
    SensorServiceFactory.registerAdapter('web', (options) => new WebSensorAdapter(options));
    SensorServiceFactory.registerAdapter('capacitor', (options) => new CapacitorSensorAdapter(options));
  }

  static createService({
    type = 'capacitor',
    options = {}
  }: {
    type?: SensorProviderType,
    options?: SensorServiceOptions
  } = {}): ISensorService {
    this.registerAllAdapters();
    return new (require('../service/sensor-service').SensorService)(type, options);
  }
}
