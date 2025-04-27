import { IBluetoothService, BluetoothDevice, BluetoothEvent, ConnectOptions } from '../types/bluetooth-service';

export class MockBluetoothAdapter implements IBluetoothService {
  private initialized = false;
  private listeners: Partial<Record<BluetoothEvent, ((payload: any) => void)[]>> = {};
  private connectedId?: string;
  private charMap: Map<string, Uint8Array> = new Map();

  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  async requestPermissions(): Promise<boolean> { return true; }
  isAvailable(): boolean { return true; }
  async scanDevices(): Promise<BluetoothDevice[]> {
    return [{ id: 'mock', name: 'Mock Device', rssi: -40, connected: false, services: ['service1'] }];
  }
  async connect(deviceId: string, options?: ConnectOptions): Promise<boolean> {
    this.connectedId = deviceId;
    this.emit('deviceConnected', { id: deviceId });
    // 模拟监听 notify/indicate
    setTimeout(() => {
      this.emit('dataReceived', { deviceId, serviceUUID: 'service1', characteristicUUID: 'char1', value: new Uint8Array([1,2,3]) });
    }, 100);
    return true;
  }
  async disconnect(deviceId: string): Promise<boolean> {
    this.emit('deviceDisconnected', { id: deviceId });
    this.connectedId = undefined;
    return true;
  }
  async write(deviceId: string, serviceUUID: string, characteristicUUID: string, value: ArrayBuffer | Uint8Array): Promise<boolean> {
    this.charMap.set(characteristicUUID, value instanceof Uint8Array ? value : new Uint8Array(value));
    // 立即回调 dataReceived 模拟回写
    this.emit('dataReceived', { deviceId, serviceUUID, characteristicUUID, value });
    return true;
  }
  on(event: BluetoothEvent, handler: (payload: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }
  off(event: BluetoothEvent, handler: (payload: any) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(fn => fn !== handler);
  }
  private emit(event: BluetoothEvent, payload: any) {
    (this.listeners[event] || []).forEach(fn => fn(payload));
  }
}
