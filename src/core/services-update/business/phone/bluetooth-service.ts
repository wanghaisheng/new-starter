// 手机端蓝牙服务接口与 PWA/Web 实现
export interface IBluetoothService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  requestPermissions(): Promise<boolean>;
  isAvailable(): boolean;
  scanDevices(): Promise<BluetoothDevice[]>;
}

export class BluetoothService implements IBluetoothService {
  private initialized = false;
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

  isAvailable(): boolean {
    return !!navigator.bluetooth;
  }

  async scanDevices(): Promise<BluetoothDevice[]> {
    if (!navigator.bluetooth) return [];
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      return [device];
    } catch {
      return [];
    }
  }
}

export class MockBluetoothService implements IBluetoothService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  async requestPermissions(): Promise<boolean> { return true; }
  isAvailable(): boolean { return true; }
  async scanDevices(): Promise<BluetoothDevice[]> { return []; }
}

// 针对不同品牌/机型的蓝牙服务实现（示例：iPhone、Samsung）
export class IPhoneBluetoothService extends BluetoothService {
  async requestPermissions(): Promise<boolean> {
    // iOS 蓝牙兼容/提示优化
    return super.requestPermissions();
  }
}

export class SamsungBluetoothService extends BluetoothService {
  async requestPermissions(): Promise<boolean> {
    // 三星机型蓝牙兼容/提示优化
    return super.requestPermissions();
  }
}
