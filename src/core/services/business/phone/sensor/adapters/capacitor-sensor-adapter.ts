import { ISensorService, SensorType, SensorEvent, SensorData, SensorServiceOptions } from '../types/sensor-service';
import { Capacitor } from '@capacitor/core';

export class CapacitorSensorAdapter implements ISensorService {
  private initialized = false;
  private listeners: Partial<Record<SensorEvent, ((data: any) => void)[]>> = {};
  private activeTypes: Set<SensorType> = new Set();
  private brand: string | undefined;

  constructor(options: SensorServiceOptions = {}) {
    this.brand = options.brand;
    // 可根据 brand 做差异化处理（如调用不同 Capacitor 插件或方法）
  }

  async initialize() { this.initialized = true; }
  isInitialized() { return this.initialized; }
  isAvailable(type: SensorType): boolean {
    // 假设所有主流传感器都可用，实际可检测插件能力
    // 可根据 this.brand 做差异化判断
    return Capacitor.isPluginAvailable('Sensors');
  }
  async start(type: SensorType): Promise<boolean> {
    if (!this.isAvailable(type)) return false;
    this.activeTypes.add(type);
    // @ts-ignore
    (window as any).Sensors?.addListener?.(`${type}Changed`, (data: any) => {
      this.emit('data', { type, timestamp: Date.now(), values: data } as SensorData);
    });
    this.emit('activated', { type, timestamp: Date.now(), values: {} });
    return true;
  }
  async stop(type: SensorType): Promise<boolean> {
    this.activeTypes.delete(type);
    // @ts-ignore
    (window as any).Sensors?.removeAllListeners?.(`${type}Changed`);
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
