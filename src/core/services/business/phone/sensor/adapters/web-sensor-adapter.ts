import { ISensorService, SensorType, SensorEvent, SensorData, SensorServiceOptions } from '../types/sensor-service';

export class WebSensorAdapter implements ISensorService {
  private initialized = false;
  private listeners: Partial<Record<SensorEvent, ((data: any) => void)[]>> = {};
  private sensors: Map<SensorType, any> = new Map();
  private brand: string | undefined;

  constructor(options: SensorServiceOptions = {}) {
    this.brand = options.brand;
    // 可根据 brand 做差异化处理
  }

  async initialize() { this.initialized = true; }
  isInitialized() { return this.initialized; }
  isAvailable(type: SensorType): boolean {
    switch (type) {
      case 'accelerometer': return 'Accelerometer' in window;
      case 'gyroscope': return 'Gyroscope' in window;
      case 'magnetometer': return 'Magnetometer' in window;
      case 'light': return 'AmbientLightSensor' in window;
      case 'proximity': return 'ondeviceproximity' in window;
      case 'orientation': return 'ondeviceorientation' in window;
      case 'stepCounter': return false; // Web 暂无原生API
      default: return false;
    }
  }
  async start(type: SensorType): Promise<boolean> {
    try {
      let sensor;
      switch (type) {
        case 'accelerometer': sensor = new (window as any).Accelerometer(); break;
        case 'gyroscope': sensor = new (window as any).Gyroscope(); break;
        case 'magnetometer': sensor = new (window as any).Magnetometer(); break;
        case 'light': sensor = new (window as any).AmbientLightSensor(); break;
        default: return false;
      }
      sensor.addEventListener('reading', () => {
        this.emit('data', {
          type,
          timestamp: Date.now(),
          values: { ...sensor }
        } as SensorData);
      });
      // 可根据 this.brand 做品牌差异化事件绑定
      this.sensors.set(type, sensor);
      sensor.start();
      this.emit('activated', { type, timestamp: Date.now(), values: {} });
      return true;
    } catch (e) {
      this.emit('error', { type, timestamp: Date.now(), values: {}, error: e });
      return false;
    }
  }
  async stop(type: SensorType): Promise<boolean> {
    const sensor = this.sensors.get(type);
    if (sensor) {
      sensor.stop();
      this.emit('deactivated', { type, timestamp: Date.now(), values: {} });
      this.sensors.delete(type);
      return true;
    }
    return false;
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
