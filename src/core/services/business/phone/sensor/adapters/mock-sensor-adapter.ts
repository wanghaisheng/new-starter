import { ISensorService, SensorType, SensorEvent, SensorData, SensorServiceOptions } from '../types/sensor-service';

export class MockSensorAdapter implements ISensorService {
  private initialized = false;
  private listeners: Partial<Record<SensorEvent, ((data: any) => void)[]>> = {};
  private activeTypes: Set<SensorType> = new Set();
  private timer: any = null;
  private brand: string | undefined;

  constructor(options: SensorServiceOptions = {}) {
    this.brand = options.brand;
    // 可根据 brand 做 mock 行为差异化
  }

  async initialize() { this.initialized = true; }
  isInitialized() { return this.initialized; }
  isAvailable(type: SensorType): boolean { return true; }
  async start(type: SensorType): Promise<boolean> {
    this.activeTypes.add(type);
    // 模拟定时推送数据
    if (!this.timer) {
      this.timer = setInterval(() => {
        for (const t of this.activeTypes) {
          // 可根据 this.brand 模拟不同品牌数据特征（只推送 number 类型，避免类型冲突）
          const values = this.brand === 'huawei'
            ? { x: Math.random(), y: Math.random(), z: Math.random(), brandCode: 1 }
            : { x: Math.random(), y: Math.random(), z: Math.random() };
          this.emit('data', { type: t, timestamp: Date.now(), values } as SensorData);
        }
      }, 100);
    }
    this.emit('activated', { type, timestamp: Date.now(), values: {} });
    return true;
  }
  async stop(type: SensorType): Promise<boolean> {
    this.activeTypes.delete(type);
    if (this.activeTypes.size === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('deactivated', { type, timestamp: Date.now(), values: {} });
    return true;
  }
  on(event: SensorEvent, handler: (data: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }
  off(event: SensorEvent, handler: (data: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter(fn => fn !== handler);
    }
  }
  private emit(event: SensorEvent, data: any) {
    if (this.listeners[event]) {
      for (const fn of this.listeners[event]!) {
        fn(data);
      }
    }
  }
}
