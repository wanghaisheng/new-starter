import { IBluetoothService, BluetoothServiceType, BluetoothEvent, BluetoothDevice, ConnectOptions } from '../types/bluetooth-service';
import { createBluetoothService } from '../factory/bluetooth-service-factory';

export class BluetoothService implements IBluetoothService {
  private adapter: IBluetoothService;
  constructor(type?: BluetoothServiceType) {
    this.adapter = createBluetoothService(type);
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
