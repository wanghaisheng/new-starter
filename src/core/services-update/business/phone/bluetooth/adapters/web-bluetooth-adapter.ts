import { IBluetoothService, BluetoothDevice, BluetoothEvent, ConnectOptions } from '../types/bluetooth-service';

// 兼容 TS：为 navigator.bluetooth 提供类型声明
interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: any;
}

declare const navigator: NavigatorWithBluetooth;

export class WebBluetoothAdapter implements IBluetoothService {
  private initialized = false;
  private device: any = null;
  private listeners: Partial<Record<BluetoothEvent, ((payload: any) => void)[]>> = {};
  private charMap: Map<string, any> = new Map();

  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  async requestPermissions(): Promise<boolean> {
    if (!navigator.bluetooth) {
      alert('当前环境不支持蓝牙');
      return false;
    }
    try {
      await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      return true;
    } catch {
      return false;
    }
  }
  isAvailable(): boolean { return !!navigator.bluetooth; }
  async scanDevices(): Promise<BluetoothDevice[]> {
    if (!navigator.bluetooth) return [];
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      this.device = device;
      return [{ id: device.id, name: device.name }];
    } catch {
      return [];
    }
  }
  async connect(deviceId: string, options?: ConnectOptions): Promise<boolean> {
    if (!this.device) return false;
    try {
      const server = await this.device.gatt.connect();
      this.emit('deviceConnected', { id: this.device.id });
      // 监听指定 service/characteristic 或全部
      let services = options?.serviceUUIDs ? await Promise.all(options.serviceUUIDs.map(uuid => server.getPrimaryService(uuid))) : await server.getPrimaryServices();
      for (const service of services) {
        let characteristics = options?.characteristicUUIDs ? await Promise.all(options.characteristicUUIDs.map(uuid => service.getCharacteristic(uuid))) : await service.getCharacteristics();
        for (const char of characteristics) {
          this.charMap.set(char.uuid, char);
          if (char.properties.notify || char.properties.indicate) {
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', (event: any) => {
              const value = event.target.value;
              this.emit('dataReceived', { deviceId: this.device.id, serviceUUID: service.uuid, characteristicUUID: char.uuid, value });
            });
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  async disconnect(deviceId: string): Promise<boolean> {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      this.emit('deviceDisconnected', { id: this.device.id });
      return true;
    }
    return false;
  }
  async write(deviceId: string, serviceUUID: string, characteristicUUID: string, value: ArrayBuffer | Uint8Array): Promise<boolean> {
    try {
      const char = this.charMap.get(characteristicUUID);
      if (char) {
        await char.writeValue(value);
        return true;
      }
      return false;
    } catch {
      return false;
    }
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
