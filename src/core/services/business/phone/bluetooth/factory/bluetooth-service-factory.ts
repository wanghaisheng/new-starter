import type { IBluetoothAdapter, BluetoothServiceType } from '../types/bluetooth-service';
import { MockBluetoothAdapter } from '../adapters/mock-bluetooth-adapter';
import { WebBluetoothAdapter } from '../adapters/web-bluetooth-adapter';
import { CapacitorBluetoothAdapter } from '../adapters/capacitor-bluetooth-adapter';
import type { IBluetoothService } from '../types/bluetooth-service';
import { BluetoothService } from '../service/bluetooth-service';

export type BluetoothServiceOptions = {
  [key: string]: any;
};

export class BluetoothServiceFactory {
  private static adapters: Record<BluetoothServiceType, (options?: BluetoothServiceOptions) => IBluetoothAdapter> = {
    mock: () => new MockBluetoothAdapter(),
    web: () => new WebBluetoothAdapter(),
    capacitor: () => new CapacitorBluetoothAdapter(),
    huawei: () => new MockBluetoothAdapter(),
    xiaomi: () => new MockBluetoothAdapter(),
  };

  static registerAdapter(type: BluetoothServiceType, factory: (options?: BluetoothServiceOptions) => IBluetoothAdapter) {
    this.adapters[type] = factory;
  }

  static getAdapter(type: BluetoothServiceType, options?: BluetoothServiceOptions): IBluetoothAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(options) : undefined;
  }

  static registerAllAdapters() {
    // 已在 adapters 静态对象注册，无需重复注册
  }

  static createService({
    type = 'capacitor',
    options = {}
  }: {
    type?: BluetoothServiceType,
    options?: BluetoothServiceOptions
  } = {}): IBluetoothService {
    const adapter = this.getAdapter(type!, options);
    if (adapter) return adapter;
    throw new Error('No valid bluetooth adapter found');
  }
}
