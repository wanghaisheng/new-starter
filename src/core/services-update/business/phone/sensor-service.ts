// 手机端传感器服务接口与 PWA/Web 实现
export interface ISensorService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  requestPermissions?(): Promise<boolean>;
  isAvailable(): boolean;
  getSensorData(): Promise<any>;
}

export class SensorService implements ISensorService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }

  isAvailable(): boolean {
    return 'DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window;
  }

  async getSensorData(): Promise<any> {
    // 这里只演示 DeviceMotionEvent，实际可扩展更多传感器
    return new Promise(resolve => {
      if ('DeviceMotionEvent' in window) {
        const handler = (event: DeviceMotionEvent) => {
          window.removeEventListener('devicemotion', handler);
          resolve({
            acceleration: event.acceleration,
            rotationRate: event.rotationRate,
            interval: event.interval
          });
        };
        window.addEventListener('devicemotion', handler, { once: true });
        // 超时兜底
        setTimeout(() => {
          window.removeEventListener('devicemotion', handler);
          resolve(undefined);
        }, 3000);
      } else {
        resolve(undefined);
      }
    });
  }
}

export class MockSensorService implements ISensorService {
  private initialized = false;
  async initialize(): Promise<void> { this.initialized = true; }
  isInitialized(): boolean { return this.initialized; }
  isAvailable(): boolean { return true; }
  async getSensorData(): Promise<any> { return { mock: true }; }
}

// 针对不同品牌/机型的传感器服务实现（示例：iPhone、Samsung）
export class IPhoneSensorService extends SensorService {
  // 可定制 iOS Safari/设备特有的传感器适配
  async getSensorData(): Promise<any> {
    // iOS 13+ 需用户手势触发权限
    if (typeof (window as any).DeviceMotionEvent?.requestPermission === 'function') {
      try {
        await (window as any).DeviceMotionEvent.requestPermission();
      } catch {}
    }
    return super.getSensorData();
  }
}

export class SamsungSensorService extends SensorService {
  // 可定制三星机型特有的传感器适配
  async getSensorData(): Promise<any> {
    // 可根据 UA/特征做特殊处理
    // 例如三星部分机型可用自定义 API 或优化事件处理
    return super.getSensorData();
  }
}
