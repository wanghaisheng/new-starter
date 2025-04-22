import type { IBluetoothService, BluetoothServiceType, BluetoothEvent, BluetoothDevice, ConnectOptions } from '../types/bluetooth-service';
import { BluetoothServiceFactory } from '../factory/bluetooth-service-factory';

// 统一蓝牙服务实现，适配不同平台
export class BluetoothService implements IBluetoothService {
  private adapter: IBluetoothService;

  constructor(type: BluetoothServiceType = 'capacitor', options: Record<string, any> = {}) {
    this.adapter = BluetoothServiceFactory.getAdapter(type, options) ?? BluetoothServiceFactory.getAdapter('mock')!;
  }

  async initialize() { await this.adapter.initialize(); }
  isInitialized(): boolean { return this.adapter.isInitialized(); }
  async requestPermissions(): Promise<boolean> { return this.adapter.requestPermissions(); }
  isAvailable(): boolean { return this.adapter.isAvailable(); }
  async scanDevices(): Promise<BluetoothDevice[]> { return this.adapter.scanDevices(); }
  async connect(deviceId: string, options?: ConnectOptions): Promise<boolean> { return this.adapter.connect(deviceId, options); }
  async disconnect(deviceId: string): Promise<boolean> { return this.adapter.disconnect(deviceId); }
  async write(deviceId: string, serviceUUID: string, characteristicUUID: string, value: ArrayBuffer | Uint8Array): Promise<boolean> { return this.adapter.write(deviceId, serviceUUID, characteristicUUID, value); }
  on(event: BluetoothEvent, handler: (payload: any) => void): void { this.adapter.on(event, handler); }
  off(event: BluetoothEvent, handler: (payload: any) => void): void { this.adapter.off(event, handler); }
}
