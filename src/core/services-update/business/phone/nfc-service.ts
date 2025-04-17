// 手机端NFC服务接口与PWA/Web实现
export interface INFCService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  requestPermissions(): Promise<boolean>;
  isAvailable(): boolean;
  readTag(): Promise<any>;
}

export class NFCService implements INFCService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }

  async requestPermissions(): Promise<boolean> {
    // Web NFC 无需单独权限，首次调用 scan 时会弹窗
    if (!('NDEFReader' in window)) {
      alert('当前环境不支持 NFC');
      return false;
    }
    try {
      // 尝试创建 NDEFReader
      new (window as any).NDEFReader();
      return true;
    } catch {
      return false;
    }
  }

  isAvailable(): boolean {
    return 'NDEFReader' in window;
  }

  async readTag(): Promise<any> {
    if (!('NDEFReader' in window)) return undefined;
    try {
      const reader = new (window as any).NDEFReader();
      await reader.scan();
      return new Promise(resolve => {
        reader.onreading = (event: any) => resolve(event.message);
        setTimeout(() => resolve(undefined), 10000); // 最多等10秒
      });
    } catch {
      return undefined;
    }
  }
}

// 针对不同品牌/机型的NFC服务实现（示例：iPhone、Samsung）
export class IPhoneNFCService extends NFCService {
  async requestPermissions(): Promise<boolean> {
    // iPhone 目前不支持 Web NFC，直接提示
    alert('iPhone/Safari 暂不支持 Web NFC');
    return false;
  }
}

export class SamsungNFCService extends NFCService {
  async requestPermissions(): Promise<boolean> {
    // 三星部分机型/浏览器可能有更好兼容性
    return super.requestPermissions();
  }
}

export class MockNFCService implements INFCService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  async requestPermissions(): Promise<boolean> { return true; }
  isAvailable(): boolean { return true; }
  async readTag(): Promise<any> { return { mock: true }; }
}
