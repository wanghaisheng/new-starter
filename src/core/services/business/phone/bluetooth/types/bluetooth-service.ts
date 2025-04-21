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

/**
 * 蓝牙服务业务接口（业务层仅依赖此接口）
 */
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

/**
 * 蓝牙适配器接口（适配器实现需实现此接口，便于插件式注册、扩展配置等）
 * 可扩展 setConfig、dispose 等方法
 */
export interface IBluetoothAdapter extends IBluetoothService {
  setConfig?(config: Record<string, any>): void;
  dispose?(): void;
}

// 支持扩展的适配器类型（插件式注册场景）
export type BluetoothServiceType = 
  | 'web' 
  | 'capacitor' 
  | 'mock' 
  | 'huawei'      // 新增华为等品牌/平台适配器
  | 'xiaomi'      // 新增小米等品牌/平台适配器
  | (string & {}); // 允许插件式自定义类型

export type BluetoothEvent = 'deviceConnected' | 'deviceDisconnected' | 'dataReceived';

export type ConnectOptions = {
  serviceUUIDs?: string[];
  characteristicUUIDs?: string[];
};
