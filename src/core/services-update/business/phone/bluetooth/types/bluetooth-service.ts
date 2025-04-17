// 蓝牙服务统一接口与类型定义

export type BluetoothDevice = {
  id: string;
  name?: string;
  address?: string;
  rssi?: number;
  connected?: boolean;
  services?: string[];
  manufacturerData?: Record<string, any>;
  [key: string]: any;
};

export interface IBluetoothService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  requestPermissions(): Promise<boolean>;
  isAvailable(): boolean;
  scanDevices(): Promise<BluetoothDevice[]>;
  connect(deviceId: string, options?: ConnectOptions): Promise<boolean>;
  disconnect(deviceId: string): Promise<boolean>;
  write(deviceId: string, serviceUUID: string, characteristicUUID: string, value: ArrayBuffer | Uint8Array): Promise<boolean>;
  on(event: BluetoothEvent, handler: (payload: any) => void): void;
  off(event: BluetoothEvent, handler: (payload: any) => void): void;
}

export type BluetoothServiceType = 'web' | 'capacitor' | 'mock';

export type BluetoothEvent = 'deviceConnected' | 'deviceDisconnected' | 'dataReceived';

export type ConnectOptions = {
  serviceUUIDs?: string[];
  characteristicUUIDs?: string[];
};
