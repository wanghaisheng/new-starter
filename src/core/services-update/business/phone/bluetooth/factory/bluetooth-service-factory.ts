import { IBluetoothService, BluetoothServiceType } from '../types/bluetooth-service';
import { Capacitor } from '@capacitor/core';
import { WebBluetoothAdapter } from '../adapters/web-bluetooth-adapter';
import { CapacitorBluetoothAdapter } from '../adapters/capacitor-bluetooth-adapter';
import { MockBluetoothAdapter } from '../adapters/mock-bluetooth-adapter';

export function createBluetoothService(type?: BluetoothServiceType): IBluetoothService {
  if (type === 'web') return new WebBluetoothAdapter();
  if (type === 'capacitor') return new CapacitorBluetoothAdapter();
  if (type === 'mock') return new MockBluetoothAdapter();
  // auto
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('BluetoothLe')) {
    return new CapacitorBluetoothAdapter();
  } else if ('bluetooth' in navigator) {
    return new WebBluetoothAdapter();
  }
  return new MockBluetoothAdapter();
}
