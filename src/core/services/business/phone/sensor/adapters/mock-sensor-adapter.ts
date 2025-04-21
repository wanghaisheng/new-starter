import { ISensorService, SensorType, SensorEvent, SensorData } from '../types/sensor-service';

export class MockSensorAdapter implements ISensorService {
  private initialized = false;
  private listeners: Partial<Record<SensorEvent, ((data: any) => void)[]>> = {};
  private activeTypes: Set<SensorType> = new Set();
  private timer: any = null;

  async initialize() { this.initialized = true; }
  isInitialized() { return this.initialized; }
  isAvailable(type: SensorType): boolean { return true; }
  async start(type: SensorType): Promise<boolean> {
    this.activeTypes.add(type);
    // 模拟定时推送数据
    if (!this.timer) {
      this.timer = setInterval(() => {
        for (const t of this.activeTypes) {
          this.emit('data', { type: t, timestamp: Date.now(), values: { x: Math.random(), y: Math.random(), z: Math.random() } } as SensorData);
        }
      }, 100);
    }
    this.emit('activated', { type });
    return true;
  }
  async stop(type: SensorType): Promise<boolean> {
    this.activeTypes.delete(type);
    if (this.activeTypes.size === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('deactivated', { type });
    return true;
  }
  on(event: SensorEvent, handler: (data: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(handler);
  }
  off(event: SensorEvent, handler: (data: any) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(fn => fn !== handler);
  }
  private emit(event: SensorEvent, data: any) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }
}
