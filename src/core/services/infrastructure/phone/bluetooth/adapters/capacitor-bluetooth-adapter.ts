import { IBluetoothService, BluetoothDevice, BluetoothEvent, ConnectOptions } from '../types/bluetooth-service';
import { Capacitor } from '@capacitor/core';
// 假设已安装 @capacitor/bluetooth-le

declare global {
  interface PluginRegistry {
    BluetoothLe?: any;
  }
}

type BluetoothLeDevice = {
  deviceId: string;
  name?: string;
};

export class CapacitorBluetoothAdapter implements IBluetoothService {
  private initialized = false;
  private listeners: Partial<Record<BluetoothEvent, ((payload: any) => void)[]>> = {};
  private connectedId?: string;
  private charMap: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isPluginAvailable('BluetoothLe')) return false;
    try {
      // @ts-ignore
      await (window as any).BluetoothLe?.requestPermissions?.();
      return true;
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    return Capacitor.isPluginAvailable('BluetoothLe');
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    if (!Capacitor.isPluginAvailable('BluetoothLe')) return [];
    try {
      // @ts-ignore
      const result = await (window as any).BluetoothLe?.requestDevice?.({});
      if (Array.isArray(result?.devices)) {
        return result.devices.map((d: BluetoothLeDevice) => ({ id: d.deviceId, name: d.name }));
      }
      if (result?.deviceId) {
        return [{ id: result.deviceId, name: result.name }];
      }
      return [];
    } catch {
      return [];
    }
  }

  async connect(deviceId: string, options?: ConnectOptions): Promise<boolean> {
    if (!Capacitor.isPluginAvailable('BluetoothLe')) return false;
    try {
      // @ts-ignore
      await (window as any).BluetoothLe?.connect?.({ deviceId });
      this.connectedId = deviceId;
      this.emit('deviceConnected', { id: deviceId });
      // 监听 notify/indicate 数据
      // @ts-ignore
      (window as any).BluetoothLe?.addListener?.('onCharacteristicValueChanged', (payload: any) => {
        if (payload.deviceId === deviceId) {
          this.emit('dataReceived', payload);
        }
      });
      // 可选：缓存指定特征
      if (options?.serviceUUIDs && options?.characteristicUUIDs) {
        for (const serviceUUID of options.serviceUUIDs) {
          for (const charUUID of options.characteristicUUIDs) {
            // @ts-ignore
            const char = await (window as any).BluetoothLe?.getCharacteristic?.({ deviceId, service: serviceUUID, characteristic: charUUID });
            if (char) this.charMap.set(charUUID, char);
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(deviceId: string): Promise<boolean> {
    if (!Capacitor.isPluginAvailable('BluetoothLe')) return false;
    try {
      // @ts-ignore
      await (window as any).BluetoothLe?.disconnect?.({ deviceId });
      this.emit('deviceDisconnected', { id: deviceId });
      return true;
    } catch {
      return false;
    }
  }

  async write(deviceId: string, serviceUUID: string, characteristicUUID: string, value: ArrayBuffer | Uint8Array): Promise<boolean> {
    try {
      // @ts-ignore
      await (window as any).BluetoothLe?.write?.({ deviceId, service: serviceUUID, characteristic: characteristicUUID, value });
      return true;
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
