import { ISensorService } from '../types/sensor-service';
import { Capacitor } from '@capacitor/core';
import { WebSensorAdapter } from '../adapters/web-sensor-adapter';
import { CapacitorSensorAdapter } from '../adapters/capacitor-sensor-adapter';
import { MockSensorAdapter } from '../adapters/mock-sensor-adapter';

export function createSensorService(type?: 'web' | 'capacitor' | 'mock'): ISensorService {
  if (type === 'web') return new WebSensorAdapter();
  if (type === 'capacitor') return new CapacitorSensorAdapter();
  if (type === 'mock') return new MockSensorAdapter();
  // auto
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Sensors')) {
    return new CapacitorSensorAdapter();
  } else if ('Accelerometer' in window || 'Gyroscope' in window) {
    return new WebSensorAdapter();
  }
  return new MockSensorAdapter();
}
